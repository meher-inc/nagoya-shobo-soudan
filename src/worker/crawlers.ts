// 検索エンジンと生成AIのクローラーの来訪を数える（GEO・SEO の計測）。
// - User-Agent の名乗りで見分けるだけ（なりすましは区別しない）。数えるのは日付・名前・ページの種類の件数だけ
// - 記録の失敗で本来の応答を壊さない（waitUntil で非同期に書き、例外はログだけ）
import type { Context } from "hono";
import type { AppEnv } from "./env";

export interface Bot {
  name: string;
  kind: "ai" | "search";
  re: RegExp;
}

// 上から順に判定する（ChatGPT-User は GPTBot より先、など名前が重なるものは具体的な方を先に）
export const BOTS: readonly Bot[] = [
  { name: "chatgpt-user", kind: "ai", re: /ChatGPT-User/i },
  { name: "oai-searchbot", kind: "ai", re: /OAI-SearchBot/i },
  { name: "gptbot", kind: "ai", re: /GPTBot/i },
  { name: "claude-user", kind: "ai", re: /Claude-User/i },
  { name: "claude-searchbot", kind: "ai", re: /Claude-SearchBot/i },
  { name: "claudebot", kind: "ai", re: /ClaudeBot|anthropic-ai/i },
  { name: "perplexity-user", kind: "ai", re: /Perplexity-User/i },
  { name: "perplexitybot", kind: "ai", re: /PerplexityBot/i },
  { name: "google-extended", kind: "ai", re: /Google-Extended/i },
  { name: "gemini", kind: "ai", re: /Gemini-Deep-Research|GoogleAgent/i },
  { name: "applebot-extended", kind: "ai", re: /Applebot-Extended/i },
  { name: "meta-externalagent", kind: "ai", re: /meta-externalagent|meta-externalfetcher/i },
  { name: "bytespider", kind: "ai", re: /Bytespider/i },
  { name: "amazonbot", kind: "ai", re: /Amazonbot/i },
  { name: "ccbot", kind: "ai", re: /CCBot/i },
  { name: "duckassistbot", kind: "ai", re: /DuckAssistBot/i },
  { name: "mistralai-user", kind: "ai", re: /MistralAI-User/i },
  { name: "googlebot", kind: "search", re: /Googlebot|Google-InspectionTool|GoogleOther/i },
  { name: "bingbot", kind: "search", re: /bingbot|BingPreview/i },
  { name: "applebot", kind: "search", re: /Applebot/i },
  { name: "yahoo-slurp", kind: "search", re: /Slurp/i },
  { name: "duckduckbot", kind: "search", re: /DuckDuckBot/i },
  { name: "yandexbot", kind: "search", re: /YandexBot/i },
];

export function detectBot(ua: string | null | undefined): Bot | null {
  if (!ua) return null;
  return BOTS.find((b) => b.re.test(ua)) ?? null;
}

export function pageKind(path: string): string {
  if (path === "/" || path === "/index.html") return "home";
  if (/^\/soudan(\/|$)/.test(path)) return "soudan";
  if (path === "/llms.txt" || path === "/llms-full.txt") return "llms";
  if (path === "/sitemap.xml") return "sitemap";
  if (path === "/robots.txt") return "robots";
  return "other";
}

const jstDate = (now: number) => new Date(now + 9 * 3600_000).toISOString().slice(0, 10);

/** クローラーなら1件数える。待たずに返り、失敗しても例外を投げない */
export function recordCrawler(c: Context<AppEnv>): void {
  if (c.req.method !== "GET" && c.req.method !== "HEAD") return;
  const bot = detectBot(c.req.header("user-agent"));
  if (!bot) return;
  try {
    const write = c.env.DB.prepare(
      `INSERT INTO crawler_hits (day, bot, kind, page, hits) VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(day, bot, page) DO UPDATE SET hits = hits + 1`,
    )
      .bind(jstDate(Date.now()), bot.name, bot.kind, pageKind(c.req.path))
      .run()
      .then(() => {})
      .catch((err) => console.error("crawler_hit_error", bot.name, err));
    try {
      c.executionCtx.waitUntil(write);
    } catch {
      // executionCtx のない環境（単体テスト）では待たない
    }
  } catch (err) {
    console.error("crawler_hit_error", err);
  }
}
