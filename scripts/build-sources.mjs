// 判定・回答の根拠にした一次情報の台帳（src/watch/sources.ts）を作る。
// 集める場所: cities/*/notes.md、docs/rule-sources.md（京都・東京・名古屋・大阪・横浜）、src/config/prompt.ts、src/rules/**/*.ts のコメントにある URL と、下の LAWS（e-Gov の法令ID）。
// 使い方: node scripts/build-sources.mjs        台帳を書き直す
//         node scripts/build-sources.mjs --check 台帳が最新でなければ失敗する（単体テストから呼ぶ）
// 新しい根拠を足したら（notes.md や src/rules のコメントに URL を書いたら）このスクリプトを実行してコミットする。
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "src/watch/sources.ts");

// 判定に使っている国の法令（法令ID は e-Gov 法令API v2 の /api/2/law_revisions/<法令ID> で 2026-11-02 に確認）
const LAWS = [
  { lawId: "323AC1000000186", title: "消防法" },
  { lawId: "336CO0000000037", title: "消防法施行令" },
  { lawId: "336M50000008006", title: "消防法施行規則" },
  { lawId: "334CO0000000306", title: "危険物の規制に関する政令" },
];

// 自社のサイトや一次情報でないものは見張らない
const SKIP = /todokede\.jp|meher|claude\.ai|github\.com|example\.|localhost/;
// 検索フォーム経由でしか本文を開けない例規集（Reiki-Base 検索システム）。自動では取れないので手で確かめる
const MANUAL = /legal-square\.com\/HAS-Shohin|SJSrbLogin\.jsf/;

const URL_RE = /https?:\/\/[^\s|"'`<>（）()「」、。]+/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function clean(s) {
  return s
    .replace(URL_RE, "")
    .replace(/^[\s/*#|-]+/, "")
    .replace(/\|/g, " ")
    .replace(/[（(]\s*[）)]/g, "")
    .replace(/(例規検索|例規集|入口|検索システム|例)\s*$/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

// どの地域の根拠か（cities/<英字>/、src/rules/cities/<英字>.ts、名古屋の prompt.ts）
function jurisdictionOf(file) {
  const rel = relative(ROOT, file);
  let m = rel.match(/^cities\/([^/]+)\//);
  if (m) return m[1];
  m = rel.match(/^src\/rules\/cities\/([^/.]+)\.ts$/);
  if (m) return m[1];
  if (rel === "src/config/prompt.ts") return "nagoya";
  return "common";
}

function collect() {
  const files = [
    ...walk(join(ROOT, "cities")).filter((f) => f.endsWith("notes.md")),
    join(ROOT, "docs/rule-sources.md"),
    join(ROOT, "src/config/prompt.ts"),
    ...walk(join(ROOT, "src/rules")).filter((f) => f.endsWith(".ts")),
  ].sort();
  const byUrl = new Map();
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    const isTs = file.endsWith(".ts");
    lines.forEach((line, i) => {
      // .ts はコメント行だけ（コード中の URL は案内用のリンクで、根拠の台帳ではない）
      if (isTs && !/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const raw of line.match(URL_RE) ?? []) {
        const url = raw.replace(/[.,;:]+$/, "");
        if (SKIP.test(url)) continue;
        // 表の行は1列目、それ以外は同じ行の文。URL だけの行は直前の行を名前にする
        // docs/rule-sources.md は「| 地域 | 資料 | URL | 確認 |」の表
        const ruleTable = file.endsWith("docs/rule-sources.md") && line.trim().startsWith("|");
        const cells = line.split("|").map((c) => c.trim());
        let title = ruleTable ? clean(cells[2] ?? "") : line.trim().startsWith("|") ? clean(cells[1] ?? "") : clean(line);
        if (!title && i > 0) title = clean(lines[i - 1]);
        const j = ruleTable ? cells[1] : jurisdictionOf(file);
        const cur = byUrl.get(url);
        if (cur) {
          if (!cur.jurisdictions.includes(j)) cur.jurisdictions.push(j);
          if (!cur.title && title) cur.title = title;
          continue;
        }
        byUrl.set(url, {
          id: createHash("sha1").update(url).digest("hex").slice(0, 12),
          kind: MANUAL.test(url) ? "manual" : "page",
          title: title || url,
          url,
          jurisdictions: [j],
        });
      }
    });
  }
  const laws = LAWS.map((l) => ({
    id: `egov-${l.lawId}`,
    kind: "egov",
    title: l.title,
    url: `https://laws.e-gov.go.jp/api/2/law_revisions/${l.lawId}`,
    jurisdictions: ["national"],
  }));
  const pages = [...byUrl.values()]
    .map((s) => ({ ...s, jurisdictions: [...s.jurisdictions].sort() }))
    .sort((a, b) => (a.jurisdictions[0] + a.url).localeCompare(b.jurisdictions[0] + b.url));
  return [...laws, ...pages];
}

function render(sources) {
  return `// このファイルは scripts/build-sources.mjs が作る。手で直さない。
// 判定・回答の根拠にした一次情報の台帳。src/worker/watch.ts が週1回取りに行き、変わったらメールで知らせる。
// kind: egov = e-Gov 法令API の改正履歴、page = ページ本文（PDF は中身そのもの）、manual = 検索フォーム経由で自動では取れないもの
import type { Source } from "./types.ts";

export const SOURCES: Source[] = [
${sources.map((s) => `  ${JSON.stringify(s)},`).join("\n")}
];
`;
}

const text = render(collect());
if (process.argv.includes("--check")) {
  let cur = "";
  try {
    cur = readFileSync(OUT, "utf8");
  } catch {}
  if (cur !== text) {
    console.error("src/watch/sources.ts が最新ではありません。node scripts/build-sources.mjs を実行してください");
    process.exit(1);
  }
} else {
  writeFileSync(OUT, text);
  const all = collect();
  const n = (k) => all.filter((s) => s.kind === k).length;
  console.log(`src/watch/sources.ts: ${all.length}件（egov ${n("egov")}・page ${n("page")}・manual ${n("manual")}）`);
}
