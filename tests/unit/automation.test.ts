// Run: node --experimental-strip-types --test tests/unit/
// 自動運用（クローラーの記録・llms.txt・IndexNow・週次レポート・受付の自動返信・生成AIからの流入元）
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectBot, pageKind } from "../../src/worker/crawlers.ts";
import { INDEXNOW_KEY, indexNowBody, llmsTxt, sitemapUrls } from "../../src/worker/geo.ts";
import { conclusion, judgeScenario, publishedScenarios, renderScenario } from "../../src/worker/guide-pages.ts";
import { jstWeekday, reportMail, usageSql, type SiteStats } from "../../src/worker/weekly.ts";
import { receiptMail } from "../../src/worker/receipt.ts";
import { classifySource } from "../../src/worker/traffic.ts";

test("detectBot: 生成AIと検索エンジンのクローラーを名前で見分ける", () => {
  assert.equal(detectBot("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot")?.name, "gptbot");
  assert.equal(detectBot("Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)")?.name, "chatgpt-user");
  assert.equal(detectBot("Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)")?.kind, "ai");
  assert.equal(detectBot("Mozilla/5.0 (compatible; PerplexityBot/1.0)")?.name, "perplexitybot");
  assert.equal(detectBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")?.kind, "search");
  assert.equal(detectBot("Mozilla/5.0 (compatible; bingbot/2.0)")?.name, "bingbot");
  assert.equal(detectBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Applebot-Extended/0.1")?.name, "applebot-extended");
  assert.equal(detectBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"), null);
  assert.equal(detectBot(undefined), null);
});

test("pageKind: ページの種類だけを残す", () => {
  assert.equal(pageKind("/"), "home");
  assert.equal(pageKind("/soudan/inshokuten-kaigyo-80"), "soudan");
  assert.equal(pageKind("/llms.txt"), "llms");
  assert.equal(pageKind("/sitemap.xml"), "sitemap");
  assert.equal(pageKind("/legal/terms"), "other");
});

test("classifySource: 生成AIの画面から来た人を ai: で分ける（gemini は google 検索と別）", () => {
  const url = new URL("https://nagoya.todokede.jp/");
  assert.equal(classifySource(url, "https://chatgpt.com/"), "ai:chatgpt");
  assert.equal(classifySource(url, "https://www.perplexity.ai/search?q=x"), "ai:perplexity");
  assert.equal(classifySource(url, "https://claude.ai/chat/abc"), "ai:claude");
  assert.equal(classifySource(url, "https://gemini.google.com/app"), "ai:gemini");
  assert.equal(classifySource(url, "https://copilot.microsoft.com/"), "ai:copilot");
  assert.equal(classifySource(url, "https://www.google.com/"), "search:google");
});

test("conclusion: 判定結果から1文の結論を作り、解説ページの冒頭と構造化データに載せる", () => {
  const s = publishedScenarios()[0];
  const r = judgeScenario(s)!;
  const c = conclusion(r);
  assert.match(c, /必要です。$/);
  const html = renderScenario("https://nagoya.todokede.jp", s, r);
  assert.ok(html.includes(`<strong>結論:</strong>`));
  assert.ok(html.includes('"@type":"BreadcrumbList"'));
  assert.ok(html.includes('"@type":"FAQPage"'));
  // 構造化データは JSON として読める
  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(m[1]);
});

test("llmsTxt: サイトの説明と、よくある相談の結論を載せる", () => {
  const t = llmsTxt("https://nagoya.todokede.jp");
  assert.match(t, /^# トドケデ AI（名古屋市）/);
  assert.ok(t.includes("公式サービスではありません"));
  assert.ok(t.includes("https://nagoya.todokede.jp/soudan/"));
  const lines = t.split("\n").filter((l) => l.startsWith("- [") && l.includes("/soudan/"));
  assert.equal(lines.length, publishedScenarios().length);
  assert.ok(lines.every((l) => /必要です。|条件次第です。/.test(l)));
});

test("IndexNow: 鍵と鍵ファイルの場所をホストごとに送る", () => {
  assert.match(INDEXNOW_KEY, /^[0-9a-f]{32}$/);
  const b = indexNowBody("osaka.todokede.jp", ["https://osaka.todokede.jp/"]);
  assert.equal(b.keyLocation, `https://osaka.todokede.jp/${INDEXNOW_KEY}.txt`);
  assert.deepEqual(sitemapUrls("<urlset><url><loc>https://a/</loc></url><url><loc> https://a/soudan </loc></url></urlset>"), ["https://a/", "https://a/soudan"]);
});

test("usageSql: 京都（秒・messages.user_id）とほか（ミリ秒・conversations 経由）で数え方を変える", () => {
  const k = usageSql("kyoto", 7, 1_800_000_000);
  assert.ok(k.includes("JOIN users u ON u.id = m.user_id"));
  assert.ok(k.includes(String(1_800_000_000 - 7 * 86400)));
  assert.ok(usageSql("join", 30, 1_800_000_000).includes("JOIN conversations c"));
});

test("jstWeekday: 日本時間の曜日", () => {
  // 2026-11-09 08:00 JST は月曜
  assert.equal(jstWeekday(Date.UTC(2026, 10, 8, 23, 0)), 1);
  assert.equal(jstWeekday(Date.UTC(2026, 10, 8, 14, 0)), 0);
});

test("reportMail: 政令市版と全国版を分け、数えられなかったサイトも書く", () => {
  const site = (name: string, month: number, general = false): SiteStats => ({
    name, general, ok: true, week: 1, month, users: 1, tests: 2, bySource: { "todokede_widget:plan": 1 }, escalations: 0, crawlers: { ai: 3, search: 4, top: [["gptbot", 3]] },
  });
  const m = reportMail("2026-11-09", [site("名古屋市", 10), site("全国版", 5, true), { ...site("京都市", 0), ok: false, error: "D1 が未接続", bySource: {}, crawlers: null }], [{ host: "nagoya.todokede.jp", urls: 14, status: 200 }], 2);
  assert.ok(m.subject.includes("政令市版 30日 10 件"));
  assert.ok(m.text.includes("全国版は直近30日 5 件"));
  assert.ok(m.text.includes("京都市: 数えられませんでした（D1 が未接続）"));
  assert.ok(m.text.includes("todokede_widget:plan: 2 件"));
  assert.ok(m.text.includes("gptbot: 6 回"));
  assert.ok(!m.text.includes("—"));
});

test("receiptMail: 約束できないこと（期限・引き受け）を書かず、紹介料なしと119番を書く", () => {
  const m = receiptMail("gyosei", "名古屋市", "山田");
  assert.ok(m.subject.includes("ご依頼を受け付けました"));
  assert.ok(m.text.startsWith("山田 様"));
  assert.ok(m.text.includes("紹介料をいただいていません"));
  assert.ok(m.text.includes("119番"));
  assert.ok(!/営業日以内|必ず/.test(m.text));
  assert.ok(!m.text.includes("—"));
});
