// 相談件数レポート（.github/workflows/usage-report.yml から実行）。
// 公開済みの各サイトの D1 で、直近30日の質問数と利用者数を数える。試験分（users.is_test=1）は除き、流入元（users.source）別にも分ける。
// 0006_traffic.sql をまだ入れていないサイトは、試験分を含んだ件数を出して印をつける。
// 使い方: CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/usage-report.mjs > report.md
import { execFileSync } from "node:child_process";

const SITES = [
  ["京都市", "kyoto-shobo-soudan", "kyoto"],
  ["東京都", "shobo-soudan", "join"],
  ["名古屋市", "nagoya-shobo-soudan", "join"],
  ["札幌市", "sapporo-shobo-soudan", "join"],
  ["大阪市", "osaka-shobo-soudan", "join"],
  ["福岡市", "fukuoka-shobo-soudan", "join"],
  ["全国版", "zenkoku-shobo-soudan", "join", { general: true }],
];

// created_at はミリ秒（名古屋・東京など）と秒（京都）が混在するので秒にそろえる
const recent = (col) => `(CASE WHEN ${col} > 100000000000 THEN ${col} / 1000 ELSE ${col} END) > CAST(strftime('%s','now') AS INTEGER) - 30*86400`;
const base = (kind) =>
  kind === "kyoto"
    ? `FROM messages m JOIN users u ON u.id = m.user_id WHERE m.role = 'user' AND ${recent("m.created_at")}`
    : `FROM messages m JOIN conversations c ON c.id = m.conversation_id JOIN users u ON u.id = c.user_id WHERE m.role = 'user' AND ${recent("m.created_at")}`;

const query = (kind, withTraffic) => {
  if (!withTraffic) return `SELECT 'all' AS source, COUNT(*) AS questions, COUNT(DISTINCT u.id) AS users, 0 AS tests ${base(kind)}`;
  return `SELECT COALESCE(u.source, 'unknown') AS source, SUM(u.is_test = 0) AS questions, COUNT(DISTINCT CASE WHEN u.is_test = 0 THEN u.id END) AS users, SUM(u.is_test = 1) AS tests ${base(kind)} GROUP BY 1`;
};

function d1(db, sql) {
  const out = execFileSync("npx", ["-y", "wrangler@4", "d1", "execute", db, "--remote", "--json", "--command", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out)[0].results;
}

const rows = [];
const bySource = new Map();
const warnings = [];
let cityTotal = 0;
let generalTotal = 0;
let testsTotal = 0;

for (const [name, db, kind, opts = {}] of SITES) {
  let results;
  let measured = true;
  try {
    results = d1(db, query(kind, true));
  } catch {
    try {
      results = d1(db, query(kind, false));
      measured = false;
    } catch (e) {
      rows.push(`| ${name} | 取得できず | - | - |`);
      warnings.push(`${name}（${db}）を数えられませんでした: ${String(e.stderr ?? e.message).slice(-300).replace(/\n/g, " ")}`);
      continue;
    }
  }
  const q = results.reduce((a, r) => a + Number(r.questions ?? 0), 0);
  const tests = results.reduce((a, r) => a + Number(r.tests ?? 0), 0);
  // 利用者数は流入元をまたいで重ならない（1人に流入元は1つ）
  const users = results.reduce((a, r) => a + Number(r.users ?? 0), 0);
  rows.push(`| ${name} | ${q}${measured ? "" : "（試験分を含む）"} | ${users} | ${measured ? tests : "-"} |`);
  if (opts.general) generalTotal += q;
  else cityTotal += q;
  testsTotal += tests;
  if (measured) for (const r of results) bySource.set(r.source, (bySource.get(r.source) ?? 0) + Number(r.questions ?? 0));
}

const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const lines = [
  `## 相談件数（直近30日、${day} 時点）`,
  "",
  "| サイト | 質問数 | 利用者数 | 除いた試験分 |",
  "|---|---|---|---|",
  ...rows,
  `| 政令市版の合計 | ${cityTotal} | | ${testsTotal} |`,
  "",
  `全国版は判定の対象外として別に数える（${generalTotal} 件）。`,
  "判定の基準：公開済み政令市版の合計が月300件（判定日 2026-12-21）。",
  "",
  "### 流入元（試験分を除く、全サイト合計）",
  "",
  "| 流入元 | 質問数 |",
  "|---|---|",
  ...[...bySource.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([s, n]) => `| ${s} | ${n} |`),
  "",
  "unknown は流入元の記録を始める前（0006_traffic.sql より前）の利用者。",
];
process.stdout.write(lines.join("\n") + "\n");
for (const w of warnings) process.stderr.write(`::warning::${w}\n`);
