#!/usr/bin/env node
// F-28（plan 20261111-city-answer-tone）の実機確認: 回答文から要否の言い切りを数える。
//
// 使い方:
//   node scripts/f28-check.mjs --base https://nagoya.todokede.jp [--out answers.json]
//     scripts/f28-cases.json の10件を順に送り（1件ずつ新しい会話）、回答を検査する。
//     最初に /?test=1 を開いて試験の利用として記録させる（相談件数から除く）。同じ利用者で10件なので1日の上限（20件）に収まる。
//   node scripts/f28-check.mjs answers.json
//     保存済みの回答（[{ "id": "...", "answer": "..." }]）を検査する。
//
// 数えるもの（1件でもあれば終了コード1）:
//   strong   「必ず」「確実に」「断定」「間違いなく」
//   bare     要否の結論の文（「必要です。」「不要です。」など）で、同じ文に「目安」「所轄」「原則」「可能性」「場合」がないもの
//   noCheck  回答に「所轄の消防署」「消防署で確認」などの確認の文がない
//   price    料金（「円」）を書いている
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { cases } = JSON.parse(readFileSync(join(here, "f28-cases.json"), "utf8"));

export function check(answer) {
  const t = answer.normalize("NFKC");
  const sentences = t.split(/(?<=[。\n])/).map((s) => s.trim()).filter(Boolean);
  const strong = (t.match(/必ず|確実に|断定|間違いなく/g) ?? []).length;
  const bare = sentences.filter(
    (s) => /(必要|不要|いりません|要りません|出す必要があります|ありません)(です|となります|になります)?。$/.test(s) && /必要|不要|届出|届け出/.test(s) && !/目安|所轄|原則|可能性|場合|かもしれ|確認/.test(s),
  );
  const noCheck = /所轄の消防署|消防署で(ご)?確認|消防署に(ご)?確認|消防署へ(ご)?確認/.test(t) ? 0 : 1;
  const price = (t.match(/\d[\d,]*\s*円|[0-9０-９]+万円/g) ?? []).length;
  return { strong, bare: bare.length, bareSentences: bare, noCheck, price };
}

async function collect(base) {
  const jar = new Map();
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const keep = (res) => {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [kv] = c.split(";");
      const i = kv.indexOf("=");
      jar.set(kv.slice(0, i), kv.slice(i + 1));
    }
  };
  keep(await fetch(`${base}/?test=1`, { redirect: "manual" }));
  const out = [];
  for (const c of cases) {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookie(), origin: base },
      body: JSON.stringify({ message: c.q }),
    });
    keep(res);
    const answer = res.ok ? await res.text() : `（HTTP ${res.status}: ${await res.text()}）`;
    out.push({ id: c.id, topic: c.topic, q: c.q, answer });
    process.stderr.write(`${c.id}: ${res.status}\n`);
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const baseAt = args.indexOf("--base");
  const outAt = args.indexOf("--out");
  let answers;
  if (baseAt >= 0) {
    answers = await collect(args[baseAt + 1].replace(/\/$/, ""));
    if (outAt >= 0) writeFileSync(args[outAt + 1], JSON.stringify(answers, null, 2));
  } else if (args[0]) {
    answers = JSON.parse(readFileSync(args[0], "utf8"));
  } else {
    console.error("使い方: node scripts/f28-check.mjs --base <URL> [--out answers.json] | node scripts/f28-check.mjs answers.json");
    process.exit(2);
  }
  let bad = 0;
  for (const a of answers) {
    const r = check(a.answer);
    const n = r.strong + r.bare + r.noCheck + r.price;
    bad += n ? 1 : 0;
    console.log(`${n ? "NG" : "OK"} ${a.id}: 強い語 ${r.strong}、目安なしの結論 ${r.bare}、所轄での確認なし ${r.noCheck}、料金 ${r.price}`);
    for (const s of r.bareSentences) console.log(`    ${s}`);
  }
  console.log(`${answers.length}件中 ${bad}件に言い切りなど`);
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
