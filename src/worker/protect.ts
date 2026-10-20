import type { Context } from "hono";
import type { AppEnv, Env } from "./env";
import { SERVICE } from "../config/service";

// 日本時間の日付（YYYY-MM-DD）
export const jstDay = (t = Date.now()) => new Date(t + 9 * 3600_000).toISOString().slice(0, 10);

// 匿名利用（ログインなし）の 1 IP あたりの 1 日の送信数。Cookie を消して無料期間を取り直す使い方の上限になる
export const ANON_IP_DAILY_LIMIT = SERVICE.anonMessagesPerIpPerDay;
// 退会者の記録（HMAC した Google アカウントの識別子）を残す期間
export const DELETED_ACCOUNT_RETENTION_MS = 3 * 365 * 86400_000;

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

// HMAC の鍵は D1 に置き、初回に乱数で作る（IP 用は日ごとに作り直し、2 日後に消す）
async function hashKey(env: Env, name: string) {
  const row = await env.DB.prepare("SELECT key FROM hash_keys WHERE name = ?").bind(name).first<{ key: string }>();
  if (row) return row.key;
  const key = hex(crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer);
  await env.DB.prepare("INSERT OR IGNORE INTO hash_keys (name, key, created_at) VALUES (?, ?, ?)").bind(name, key, Date.now()).run();
  // 同時に作られた場合は先に入った方を使う
  return (await env.DB.prepare("SELECT key FROM hash_keys WHERE name = ?").bind(name).first<{ key: string }>())!.key;
}

async function hmac(key: string, value: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(value)));
}

// E2E 専用: x-test-ip ヘッダーで送信元 IP を差し替えられる（テスト用ログインが有効な環境のみ）
const testIp = (c: Context<AppEnv>) => (c.env.E2E_MODE === "1" ? c.req.header("x-test-ip") : undefined);
export const clientIp = (c: Context<AppEnv>) => testIp(c) ?? c.req.header("cf-connecting-ip") ?? "unknown";

// 匿名利用の IP 単位の日次上限。上限内なら 1 つ数えて true を返す
export async function takeAnonIpQuota(c: Context<AppEnv>) {
  // E2E は同じ IP から何度も匿名で送るため、x-test-ip を指定したテスト以外では数えない
  if (c.env.E2E_MODE === "1" && !testIp(c)) return true;
  const day = jstDay();
  const ipHash = await hmac(await hashKey(c.env, `ip:${day}`), clientIp(c));
  const row = await c.env.DB.prepare(
    `INSERT INTO ip_daily_usage (ip_hash, day, count) VALUES (?, ?, 1)
     ON CONFLICT(ip_hash, day) DO UPDATE SET count = count + 1
     WHERE count < ?
     RETURNING count`,
  )
    .bind(ipHash, day, ANON_IP_DAILY_LIMIT)
    .first<{ count: number }>();
  return row != null;
}

// Cloudflare Turnstile（見えないモード）。サイトキーとシークレットの両方がそろった環境だけで確認する
export const turnstileEnabled = (env: Env) => !!env.TURNSTILE_SECRET && !!env.TURNSTILE_SITEKEY;
export const TURNSTILE_ACTION = "anon_start";

export async function verifyTurnstile(c: Context<AppEnv>, token: unknown) {
  if (!turnstileEnabled(c.env)) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const expected = new Set(
    (c.env.TURNSTILE_HOSTNAMES ?? new URL(c.req.url).hostname)
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean),
  );
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret: c.env.TURNSTILE_SECRET!, response: token, remoteip: clientIp(c) }),
    });
    if (!r.ok) return false;
    const result = (await r.json()) as { success?: boolean; action?: string; hostname?: string };
    // テスト用のキー（常に成功）は action と hostname を返さないため、その場合だけ確認を省く
    const testKey = c.env.TURNSTILE_SECRET!.startsWith("1x0000000000000000000000000000000");
    return !!result.success && (testKey || (result.action === TURNSTILE_ACTION && expected.has(result.hostname ?? "")));
  } catch {
    return false;
  }
}

// 退会者の照合用。Google アカウントの識別子を HMAC した値
export async function accountHash(env: Env, googleSub: string) {
  return hmac(await hashKey(env, "account"), googleSub);
}

// 過去に退会した Google アカウントなら、そのときの無料期間の開始日時（ミリ秒）を返す
export async function previousTrialStart(env: Env, googleSub: string) {
  const row = await env.DB.prepare("SELECT trial_started_at FROM deleted_accounts WHERE sub_hash = ?")
    .bind(await accountHash(env, googleSub))
    .first<{ trial_started_at: number | null }>();
  return row?.trial_started_at ?? null;
}

// 退会したことのある Google アカウントなら、無料期間を当時の開始日時に戻す（新しく 24 時間を与えない）
export async function restorePreviousTrial(env: Env, googleSub: string, userId: string) {
  const previous = await previousTrialStart(env, googleSub);
  if (previous == null) return;
  await env.DB.prepare("UPDATE users SET trial_started_at = min(coalesce(trial_started_at, ?1), ?1) WHERE id = ?2").bind(previous, userId).run();
}

// 日別の集計（無料開始・24時間以降の再訪・Googleログイン・課金開始）
export type MetricKind = "trial_start" | "revisit_after_trial" | "google_login" | "subscription_start";
export const METRIC_KINDS: MetricKind[] = ["trial_start", "revisit_after_trial", "google_login", "subscription_start"];
export const METRIC_LABELS: Record<MetricKind, string> = {
  trial_start: "無料開始",
  revisit_after_trial: `${SERVICE.trialHours}時間以降に再訪`,
  google_login: "Googleログイン",
  subscription_start: "課金開始",
};

export async function countMetric(env: Env, kind: MetricKind) {
  await env.DB.prepare(
    `INSERT INTO daily_metrics (day, kind, count) VALUES (?, ?, 1)
     ON CONFLICT(day, kind) DO UPDATE SET count = count + 1`,
  )
    .bind(jstDay(), kind)
    .run();
}

// 直近 30 日の日別集計（新しい日付から）
export async function dailyMetrics(env: Env) {
  const { results } = await env.DB.prepare("SELECT day, kind, count FROM daily_metrics WHERE day >= ? ORDER BY day DESC")
    .bind(jstDay(Date.now() - 29 * 86400_000))
    .all<{ day: string; kind: MetricKind; count: number }>();
  return [...new Set(results.map((r) => r.day))].map((day) => ({
    day,
    counts: METRIC_KINDS.map((k) => results.find((r) => r.day === day && r.kind === k)?.count ?? 0),
  }));
}

// IP 単位の上限の記録とその日の鍵は 2 日で、退会者の記録は 3 年で消す（鍵を消すと過去の値は元の IP と結び付けられない）
export async function cleanupProtect(env: Env, now = Date.now()) {
  const cutoff = jstDay(now - 2 * 86400_000);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM ip_daily_usage WHERE day < ?").bind(cutoff),
    env.DB.prepare("DELETE FROM hash_keys WHERE name LIKE 'ip:%' AND name < ?").bind(`ip:${cutoff}`),
    env.DB.prepare("DELETE FROM deleted_accounts WHERE deleted_at < ?").bind(now - DELETED_ACCOUNT_RETENTION_MS),
  ]);
}
