// 週次の自動処理（月曜 日本時間8時の Cron）。動かすのは USAGE_REPORT=1 の Worker（名古屋）だけ。
// 1. IndexNow: 公開済みの各サイトの sitemap の URL を検索エンジンに知らせる（geo.ts）
// 2. 利用レポート: 公開済みの各サイトの D1 を数え、NOTIFY_TO にメールする
//    - 試験分（users.is_test=1）を除いた質問数・利用者数（直近7日・30日）、流入元別（7日）
//    - 専門家への依頼の件数、生成AI・検索エンジンのクローラーの来訪数、根拠の一次情報の変更
//    GitHub Actions を使わない（meher-inc の Actions は予算上限で止まることがあるため）。scripts/usage-report.mjs と同じ数え方
import type { Env } from "./env";
import { jstHour } from "../watch/check.ts";
import { INDEXNOW_ENDPOINT, PUBLISHED_HOSTS, indexNowBody, sitemapUrls } from "./geo.ts";
import { publishedScenarios } from "./guide-pages.ts";

type Kind = "kyoto" | "join";
export interface Site {
  name: string;
  host: string;
  kind: Kind;
  general?: boolean;
  db: (env: Env) => D1Database | undefined;
}

export const SITES: Site[] = [
  { name: "京都市", host: "kyoto.todokede.jp", kind: "kyoto", db: (e) => e.REPORT_KYOTO },
  { name: "東京都", host: "tokyo.todokede.jp", kind: "join", db: (e) => e.REPORT_TOKYO },
  { name: "名古屋市", host: "nagoya.todokede.jp", kind: "join", db: (e) => e.DB },
  { name: "札幌市", host: "sapporo.todokede.jp", kind: "join", db: (e) => e.REPORT_SAPPORO },
  { name: "大阪市", host: "osaka.todokede.jp", kind: "join", db: (e) => e.REPORT_OSAKA },
  { name: "福岡市", host: "fukuoka.todokede.jp", kind: "join", db: (e) => e.REPORT_FUKUOKA },
  { name: "全国版", host: "zenkoku.todokede.jp", kind: "join", general: true, db: (e) => e.REPORT_ZENKOKU },
];

const DAY_S = 86400;
// created_at はミリ秒（名古屋・東京など）と秒（京都）が混在するので秒にそろえる
const sec = (col: string) => `(CASE WHEN ${col} > 100000000000 THEN ${col} / 1000 ELSE ${col} END)`;
const from = (kind: Kind) =>
  kind === "kyoto"
    ? "FROM messages m JOIN users u ON u.id = m.user_id WHERE m.role = 'user'"
    : "FROM messages m JOIN conversations c ON c.id = m.conversation_id JOIN users u ON u.id = c.user_id WHERE m.role = 'user'";

export function usageSql(kind: Kind, days: number, nowS: number): string {
  return `SELECT COALESCE(u.source, 'unknown') AS source, SUM(u.is_test = 0) AS questions, COUNT(DISTINCT CASE WHEN u.is_test = 0 THEN u.id END) AS users, SUM(u.is_test = 1) AS tests ${from(kind)} AND ${sec("m.created_at")} > ${nowS - days * DAY_S} GROUP BY 1`;
}

export interface SiteStats {
  name: string;
  general: boolean;
  ok: boolean;
  error?: string;
  week: number;
  month: number;
  users: number;
  tests: number;
  bySource: Record<string, number>;
  escalations: number | null;
  crawlers: { ai: number; search: number; top: [string, number][] } | null;
}

interface UsageRow {
  source: string;
  questions: number | null;
  users: number | null;
  tests: number | null;
}

const sum = (rows: UsageRow[], k: keyof UsageRow) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0);

async function siteStats(env: Env, site: Site, now: number): Promise<SiteStats> {
  const base: SiteStats = { name: site.name, general: !!site.general, ok: false, week: 0, month: 0, users: 0, tests: 0, bySource: {}, escalations: null, crawlers: null };
  const db = site.db(env);
  if (!db) return { ...base, error: "D1 が未接続" };
  const nowS = Math.floor(now / 1000);
  try {
    const week = (await db.prepare(usageSql(site.kind, 7, nowS)).all<UsageRow>()).results;
    const month = (await db.prepare(usageSql(site.kind, 30, nowS)).all<UsageRow>()).results;
    const bySource: Record<string, number> = {};
    for (const r of week) if (Number(r.questions ?? 0) > 0) bySource[r.source] = Number(r.questions);
    const stats: SiteStats = { ...base, ok: true, week: sum(week, "questions"), month: sum(month, "questions"), users: sum(month, "users"), tests: sum(week, "tests"), bySource };
    try {
      const e = await db
        .prepare(`SELECT COUNT(*) AS n FROM escalations WHERE status = 'requested' AND ${sec("requested_at")} > ?`)
        .bind(nowS - 7 * DAY_S)
        .first<{ n: number }>();
      stats.escalations = Number(e?.n ?? 0);
    } catch {
      // escalations の列が違う版は数えない
    }
    try {
      const since = new Date(now - 7 * DAY_S * 1000 + 9 * 3600_000).toISOString().slice(0, 10);
      const rows = (await db.prepare("SELECT bot, kind, SUM(hits) AS hits FROM crawler_hits WHERE day > ? GROUP BY bot, kind ORDER BY hits DESC").bind(since).all<{ bot: string; kind: string; hits: number }>()).results;
      stats.crawlers = {
        ai: rows.filter((r) => r.kind === "ai").reduce((a, r) => a + Number(r.hits), 0),
        search: rows.filter((r) => r.kind === "search").reduce((a, r) => a + Number(r.hits), 0),
        top: rows.slice(0, 5).map((r) => [r.bot, Number(r.hits)]),
      };
    } catch {
      // crawler_hits（0010）をまだ入れていないサイト
    }
    return stats;
  } catch (e) {
    return { ...base, error: String(e instanceof Error ? e.message : e).slice(0, 200) };
  }
}

export interface IndexNowResult {
  host: string;
  urls: number;
  status: number | null;
  error?: string;
}

export function reportMail(day: string, sites: SiteStats[], indexNow: IndexNowResult[], sourceEvents: number): { subject: string; text: string } {
  const city = sites.filter((s) => !s.general);
  const general = sites.filter((s) => s.general);
  const cityMonth = city.reduce((a, s) => a + s.month, 0);
  const cityWeek = city.reduce((a, s) => a + s.week, 0);
  const sources: Record<string, number> = {};
  for (const s of sites) for (const [k, v] of Object.entries(s.bySource)) sources[k] = (sources[k] ?? 0) + v;
  const ai = sites.reduce((a, s) => a + (s.crawlers?.ai ?? 0), 0);
  const search = sites.reduce((a, s) => a + (s.crawlers?.search ?? 0), 0);
  const esc = sites.reduce((a, s) => a + (s.escalations ?? 0), 0);
  const lines = [
    `政令市版の質問は直近7日 ${cityWeek} 件、直近30日 ${cityMonth} 件です（判定の基準は月300件、判定日 2026-12-21）。全国版は直近30日 ${general.reduce((a, s) => a + s.month, 0)} 件です。`,
    `専門家への依頼は直近7日 ${esc} 件、生成AIのクローラーの来訪は ${ai} 回、検索エンジンは ${search} 回でした。`,
    "",
    "■ サイト別（試験分を除く）",
    ...sites.map((s) =>
      s.ok
        ? `・${s.name}: 7日 ${s.week} 件／30日 ${s.month} 件（利用者 ${s.users} 人、除いた試験分 ${s.tests} 件）${s.escalations !== null ? `、依頼 ${s.escalations} 件` : ""}${s.crawlers ? `、AIクローラー ${s.crawlers.ai} 回` : ""}`
        : `・${s.name}: 数えられませんでした（${s.error ?? "不明"}）`,
    ),
    "",
    "■ 流入元（直近7日の質問数）",
    ...(Object.keys(sources).length ? Object.entries(sources).sort((a, b) => b[1] - a[1]).map(([k, v]) => `・${k}: ${v} 件`) : ["・なし"]),
    "",
    "■ 来訪の多いクローラー（直近7日）",
    ...(() => {
      const top: Record<string, number> = {};
      for (const s of sites) for (const [b, n] of s.crawlers?.top ?? []) top[b] = (top[b] ?? 0) + n;
      const list = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8);
      return list.length ? list.map(([b, n]) => `・${b}: ${n} 回`) : ["・記録なし"];
    })(),
    "",
    "■ IndexNow（検索エンジンへの更新通知）",
    ...indexNow.map((r) => `・${r.host}: ${r.status && r.status < 300 ? `送信 ${r.urls} 件（HTTP ${r.status}）` : `失敗（${r.error ?? `HTTP ${r.status}`}）`}`),
    "",
    `■ 根拠の一次情報の変更（直近7日の記録）: ${sourceEvents} 件。詳しくは毎朝9時の見張りのメールを見てください。`,
    "",
    "この通知は nagoya-shobo-soudan の src/worker/weekly.ts が毎週月曜の朝に送っています。",
  ];
  return { subject: `【トドケデ AI】週次レポート（${day}）政令市版 30日 ${cityMonth} 件`, text: lines.join("\n") };
}

async function submitIndexNow(env: Env): Promise<IndexNowResult[]> {
  const out: IndexNowResult[] = [];
  for (const host of PUBLISHED_HOSTS) {
    let urls: string[] = [];
    try {
      if (host === new URL(env.CANONICAL_ORIGIN ?? "https://nagoya.todokede.jp").hostname) {
        const origin = `https://${host}`;
        urls = ["/", "/soudan", ...publishedScenarios().map((s) => `/soudan/${s.slug}`)].map((p) => `${origin}${p}`);
      } else {
        const res = await fetch(`https://${host}/sitemap.xml`, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) throw new Error(`sitemap HTTP ${res.status}`);
        urls = sitemapUrls(await res.text());
      }
      if (!urls.length) throw new Error("sitemap が空");
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(indexNowBody(host, urls)),
        signal: AbortSignal.timeout(15_000),
      });
      out.push({ host, urls: urls.length, status: res.status, error: res.ok ? undefined : `HTTP ${res.status}（鍵ファイル未設置の版は失敗します）` });
    } catch (e) {
      out.push({ host, urls: urls.length, status: null, error: String(e instanceof Error ? e.message : e).slice(0, 120) });
    }
  }
  console.log("indexnow", out);
  return out;
}

/** 日本時間の曜日（0=日） */
export const jstWeekday = (now: number) => new Date(now + 9 * 3600_000).getUTCDay();

export async function runWeekly(env: Env, now: number) {
  if (env.USAGE_REPORT !== "1") return;
  if (jstWeekday(now) !== 1 || jstHour(now) !== 8) return;
  const indexNow = await submitIndexNow(env);
  const sites = await Promise.all(SITES.map((s) => siteStats(env, s, now)));
  let sourceEvents = 0;
  try {
    const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM source_events WHERE detected_at > ?").bind(now - 7 * DAY_S * 1000).first<{ n: number }>();
    sourceEvents = Number(r?.n ?? 0);
  } catch {
    // 0009 のない環境
  }
  const day = new Date(now + 9 * 3600_000).toISOString().slice(0, 10);
  const mail = reportMail(day, sites, indexNow, sourceEvents);
  console.log("weekly_report", mail.subject);
  if (!env.EMAIL || !env.NOTIFY_FROM || !env.NOTIFY_TO) return;
  for (const to of env.NOTIFY_TO.split(",").map((s) => s.trim()).filter(Boolean))
    await env.EMAIL.send({ to, from: { email: env.NOTIFY_FROM, name: "トドケデ AI" }, subject: mail.subject, text: mail.text });
}
