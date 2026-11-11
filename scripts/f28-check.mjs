#!/usr/bin/env node
// F-28（plan 20261111-city-answer-tone）の実機確認: 回答文から要否の言い切りを数える。
//
// 使い方:
//   node scripts/f28-check.mjs --base https://nagoya.todokede.jp [--out answers.json]
//     scripts/f28-cases.json の10件を順に送り（1件ずつ新しい会話）、回答を検査する。
//     最初に /?test=1 を開いて試験の利用として記録させる（相談件数から除く）。同じ利用者で10件なので1日の上限（20件）に収まる。
//   node scripts/f28-check.mjs answers.json
//     保存済みの回答（[{ "id": "...", "answer": "...", "actions": {...} }]。actions は省略可）を検査する。
//
// 数えるもの（1件でもあれば終了コード1）:
//   strong   「必ず」「確実に」「間違いなく」「断定します」など（「断定できません」は数えない）
//   bare     要否の結論の文（「必要です。」「不要です。」「〜する必要があります。」「必要ありません。」「必須です。」
//            「〜しなければなりません。」「選任義務があります。」など）で、
//            同じ文に「目安」「所轄」「原則」「可能性」「場合」「確認」などがないもの。文末の根拠条文の括弧（「…が必要です（令第1条の2）。」）は外して見る
//   noCheck  回答に「所轄の消防署」「消防署で確認」などの確認の文がない
//   price    料金（「円」）を書いている
// 画面の文: x-actions（回答の下のボタン）と src/client/echo.ts の stripEchoes を通した、画面に出る文でも同じものを数える。
//   echo.ts は TypeScript なので `node --experimental-strip-types scripts/f28-check.mjs ...` で実行する（読み込めなければ API の文だけを見る）
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { cases } = JSON.parse(readFileSync(join(here, "f28-cases.json"), "utf8"));

const STRONG = /必ず|確実に|間違いなく|断定(?:します|できます|いたします|して(?:おき|い)ます)/g;
// 義務の言い方（「必須です」「届け出なければなりません」「しなければいけません」「選任義務があります」）も結論の文として数える（レビュー L-11）
const CONCLUSION =
  /(?:必要|不要|必須)(?:です|となります|になります|でございます)?$|必要があります$|必要(?:は)?ありません$|(?:いりません|要りません)$|なければ(?:なりません|いけません|ならない)$|義務(?:が|は)?(?:あります|ございます)$|義務(?:です|となります)$/;
const TOPIC = /必要|不要|必須|義務|届出|届け出|設置|選任|提出|なければ/;
const SOFT = /目安|所轄|原則|可能性|場合|かもしれ|確認|条件次第|はず|と考えられ|見込み/;
const CHECK = /所轄の消防署|消防署で(?:ご)?確認|消防署に(?:ご)?(?:確認|相談)|消防署へ(?:ご)?(?:確認|相談)|消防署(?:で|に|へ)(?:ご)?(?:お)?問い合わせ/;

/** 文に分ける（句点・疑問符・改行）。文末の根拠条文の括弧と句点を外した形も持つ */
export function sentences(text) {
  return text
    .normalize("NFKC")
    .split(/(?<=[。？?！!])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      // Markdown の強調・箇条書きの記号を外してから見る
      let core = raw.replace(/[*_`]/g, "").replace(/^\s*(?:[-・•]|\d+[.)])\s+/, "").replace(/[。．.？?！!]+$/, "").trim();
      // 文末の括弧（根拠条文など）を外す。二重に付いていても外す
      for (let i = 0; i < 3; i++) core = core.replace(/\s*[（(][^（()）]*[)）]$/, "").replace(/[。．.]+$/, "").trim();
      return { raw, core };
    });
}

export function check(answer) {
  const t = answer.normalize("NFKC");
  const strong = (t.match(STRONG) ?? []).length;
  const bare = sentences(t).filter(({ core }) => CONCLUSION.test(core) && TOPIC.test(core) && !SOFT.test(core)).map(({ raw }) => raw);
  const noCheck = CHECK.test(t) ? 0 : 1;
  const price = (t.match(/\d[\d,]*\s*円|\d+万円/g) ?? []).length;
  return { strong, bare: bare.length, bareSentences: bare, noCheck, price };
}

/** 画面に出る文（回答の下のボタンと重なる文を除いた後）で数える。stripEchoes は src/client/echo.ts のもの */
export function checkScreen(answer, actions, stripEchoes) {
  return check(stripEchoes(answer, actions ?? { buttons: [] }));
}

async function loadStripEchoes() {
  try {
    return (await import("../src/client/echo.ts")).stripEchoes;
  } catch {
    return null;
  }
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
    // 回答の下のボタン（画面の文を作るのに使う）
    const header = res.headers.get("x-actions");
    const actions = header ? JSON.parse(decodeURIComponent(header)) : { buttons: [] };
    out.push({ id: c.id, topic: c.topic, q: c.q, answer, actions });
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
  const stripEchoes = await loadStripEchoes();
  if (!stripEchoes) console.log("（画面の文は検査していません。node --experimental-strip-types で実行すると、画面の文でも数えます）");
  const line = (r) => `強い語 ${r.strong}、目安なしの結論 ${r.bare}、所轄での確認なし ${r.noCheck}、料金 ${r.price}`;
  const total = (r) => r.strong + r.bare + r.noCheck + r.price;
  let bad = 0;
  for (const a of answers) {
    const r = check(a.answer);
    const sc = stripEchoes ? checkScreen(a.answer, a.actions, stripEchoes) : null;
    const n = total(r) + (sc ? total(sc) : 0);
    bad += n ? 1 : 0;
    console.log(`${n ? "NG" : "OK"} ${a.id}: API の文 ${line(r)}${sc ? ` ／ 画面の文 ${line(sc)}` : ""}`);
    for (const s of new Set([...r.bareSentences, ...(sc?.bareSentences ?? [])])) console.log(`    ${s}`);
  }
  console.log(`${answers.length}件中 ${bad}件に言い切りなど`);
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
