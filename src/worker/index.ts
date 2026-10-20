import { Hono } from "hono";
import type { AppEnv, Env, User } from "./env";
import { destroySession, loadUser, publicMe, TRIAL_MS } from "./session";
import { auth } from "./auth";
import { billing, cancelSubscriptions, stripeWebhook } from "./billing";
import { accountHash, cleanupProtect, countMetric, dailyMetrics, METRIC_KINDS, METRIC_LABELS } from "./protect";
import { chat, conversations } from "./chat";
import { SERVICE } from "../config/service";
import { LEGAL } from "../shared/consent";
import { withSharedSecrets } from "./secrets";

const app = new Hono<AppEnv>();

const isLocal = (url: string) => ["localhost", "127.0.0.1"].includes(new URL(url).hostname);
// Test endpoints: local E2E, or the staging Worker (E2E_MODE is set only in env.staging, never in production).
const testMode = (c: { env: Env; req: { url: string } }) => c.env.E2E_MODE === "1" && (isLocal(c.req.url) || c.env.ENV_NAME === "staging");

// Once the custom domain is live, workers.dev pages move to it permanently (API and OAuth stay where they are).
app.use("*", async (c, next) => {
  const canonical = c.env.CANONICAL_ORIGIN;
  const url = new URL(c.req.url);
  if (canonical && c.req.method === "GET" && url.hostname.endsWith(".workers.dev") && url.origin !== canonical && !/^\/(api|auth)\//.test(url.pathname)) {
    return c.redirect(`${canonical}${url.pathname}${url.search}`, 301);
  }
  await next();
});

app.use("*", async (c, next) => {
  c.set("user", c.req.path.startsWith("/api/stripe/") ? null : await loadUser(c));
  await next();
  c.header("x-content-type-options", "nosniff");
  c.header("referrer-policy", "strict-origin-when-cross-origin");
  c.header("x-frame-options", "DENY");
});

// Reject cross-site state-changing API calls (cookie auth + SameSite=Lax is the first line).
app.use("/api/*", async (c, next) => {
  if (c.req.method !== "GET" && !c.req.path.startsWith("/api/stripe/")) {
    const origin = c.req.header("origin");
    if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden" }, 403);
  }
  await next();
});

app.route("/auth", auth);
app.get("/api/me", async (c) => {
  await noteRevisit(c.env, c.get("user"));
  return c.json(publicMe(c.get("user"), c.env));
});

// 無料期間を過ぎてから戻ってきた人を、1 人 1 回だけ数える
async function noteRevisit(env: Env, user: User | null) {
  const now = Date.now();
  if (!user?.trial_started_at || now < user.trial_started_at + TRIAL_MS || user.revisited_at) return;
  const r = await env.DB.prepare("UPDATE users SET revisited_at = ? WHERE id = ? AND revisited_at IS NULL").bind(now, user.id).run();
  if (r.meta.changes) await countMetric(env, "revisit_after_trial");
}

// 退会。有料プランは直ちに解約（日割りの返金なし）し、相談履歴・アカウント情報を直ちに削除する。
// 同じ Google アカウントで再登録したときに無料期間を復活させないよう、識別子の HMAC と無料期間の開始日時だけを 3 年残す
app.delete("/api/account", async (c) => {
  const user = c.get("user");
  if (!user || user.is_anonymous) return c.json({ error: "unauthorized" }, 401);
  try {
    await cancelSubscriptions(c.env, user);
  } catch (e) {
    console.error("cancel_failed", e);
    return c.json({ error: "cancel_failed" }, 502);
  }
  const db = c.env.DB;
  await db.batch([
    db
      .prepare(
        `INSERT INTO deleted_accounts (sub_hash, trial_started_at, deleted_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(sub_hash) DO UPDATE SET trial_started_at = coalesce(min(deleted_accounts.trial_started_at, excluded.trial_started_at), deleted_accounts.trial_started_at, excluded.trial_started_at), deleted_at = excluded.deleted_at`,
      )
      .bind(await accountHash(c.env, user.google_sub), user.trial_started_at, Date.now()),
    // 相談履歴・セッションは users の削除に連動して消える（ON DELETE CASCADE）
    db.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ]);
  await destroySession(c);
  return c.json({ ok: true });
});
app.route("/api/chat", chat);
app.route("/api/conversations", conversations);
app.route("/api/billing", billing);
app.route("/api/stripe/webhook", stripeWebhook);

// Local E2E only: move the trial start to the given hours ago.
app.post("/api/test/trial", async (c) => {
  const user = c.get("user");
  if (!testMode(c) || !user) return c.notFound();
  const { hoursAgo } = (await c.req.json()) as { hoursAgo: number };
  await c.env.DB.prepare("UPDATE users SET trial_started_at = ? WHERE id = ?").bind(Date.now() - hoursAgo * 3600_000, user.id).run();
  return c.json({ ok: true });
});

// Local E2E only: move the trial start back so the paywall can be exercised.
app.post("/api/test/expire-trial", async (c) => {
  const user = c.get("user");
  if (!testMode(c) || !user) return c.notFound();
  await c.env.DB.prepare("UPDATE users SET trial_started_at = ? WHERE id = ?")
    .bind(Date.now() - (SERVICE.trialHours + 1) * 60 * 60 * 1000, user.id)
    .run();
  return c.json({ ok: true });
});

app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));

// 日別の利用。ADMIN_EMAILS に含まれる Google アカウントだけが閲覧できる（個人を特定しない件数のみ）
app.get("/admin", async (c) => {
  const user = c.get("user");
  const admins = (c.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!user?.email || user.is_anonymous || !admins.includes(user.email)) return c.text("forbidden", 403);
  const daily = await dailyMetrics(c.env);
  const cell = (v: string | number) => `<td>${String(v).replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`)}</td>`;
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>管理</title>
<style>body{font-family:system-ui,sans-serif;margin:16px;color:#0f172a}table{border-collapse:collapse;width:100%;font-size:12px;margin-bottom:24px}th,td{border-bottom:1px solid #e2e8f0;padding:6px;text-align:left}h2{font-size:15px}.hint{font-size:12px;color:#64748b}</style></head><body>
<h1>${SERVICE.name} 管理</h1>
<h2>日別の利用（直近30日・日本時間）</h2><table><tr>${["日付", ...METRIC_KINDS.map((k) => METRIC_LABELS[k])].map((h) => `<th>${h}</th>`).join("")}</tr>${daily
    .map((d) => `<tr>${[d.day, ...d.counts].map(cell).join("")}</tr>`)
    .join("")}</table>
<p class="hint">無料開始: 最初の相談の回答が始まった人数。${SERVICE.trialHours}時間以降に再訪: 無料期間の開始から${SERVICE.trialHours}時間を過ぎて初めて戻ってきた人数（1人1回）。Googleログイン: ログインの回数。課金開始: Stripe で月額プランが作成された件数（customer.subscription.created）。</p>
</body></html>`;
  return c.body(html, 200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  });
});

// 利用規約とプライバシーポリシーは services.todokede.jp に一元化した。以前の URL はそこへ転送する
app.get("/legal/terms", (c) => c.redirect(LEGAL.terms, 301));
app.get("/legal/privacy", (c) => c.redirect(LEGAL.privacy, 301));

app.get("/robots.txt", (c) => {
  const origin = c.env.CANONICAL_ORIGIN ?? new URL(c.req.url).origin;
  return c.text(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nDisallow: /admin\n\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get("/sitemap.xml", (c) => {
  const origin = c.env.CANONICAL_ORIGIN ?? new URL(c.req.url).origin;
  const urls = ["/", "/legal/tokushoho"].map((p) => `<url><loc>${origin}${p}</loc></url>`).join("");
  return c.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, 200, {
    "content-type": "application/xml; charset=utf-8",
  });
});

function homeHead(origin: string) {
  const publisher = { "@type": "Organization", name: SERVICE.seller.name, url: "https://meher-inc.co.jp/" };
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebSite", name: SERVICE.name, url: `${origin}/`, inLanguage: "ja", publisher },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SERVICE.name,
      url: `${origin}/`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      areaServed: { "@type": "AdministrativeArea", name: SERVICE.areaServed },
      offers: { "@type": "Offer", price: SERVICE.price.amount, priceCurrency: "JPY", description: SERVICE.price.label },
      publisher,
    },
  ];
  return [
    `<link rel="canonical" href="${origin}/">`,
    `<meta property="og:type" content="website"><meta property="og:url" content="${origin}/"><meta property="og:site_name" content="${SERVICE.name}"><meta property="og:locale" content="ja_JP">`,
    ...jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`),
  ].join("\n");
}

// Inline the session state into the shell so the first paint needs no extra round trip.
app.get("*", async (c) => {
  const asset = await c.env.ASSETS.fetch(new Request(new URL("/", c.req.url)));
  const html = await asset.text();
  await noteRevisit(c.env, c.get("user"));
  const me = JSON.stringify(publicMe(c.get("user"), c.env)).replace(/</g, "\\u003c");
  const origin = c.env.CANONICAL_ORIGIN ?? new URL(c.req.url).origin;
  const head = c.req.path === "/" ? homeHead(origin) : "";
  return c.html(html.replace("<!--ME-->", `${head}<script>window.__ME__=${me}</script>`), 200, {
    "cache-control": "no-store",
  });
});

export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, await withSharedSecrets(env), ctx);
  },
  // 毎日: IP 単位の上限の記録と鍵（2 日）、退会者の記録（3 年）を消す。何度動いても結果は同じ
  async scheduled(_event, env) {
    await cleanupProtect(env);
  },
} satisfies ExportedHandler<AppEnv["Bindings"]>;
