// Run: node --experimental-strip-types --test tests/unit/
// 根拠の一次情報の見張り（src/watch/check.ts、src/worker/watch.ts）
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHECK_INTERVAL_MS, compare, htmlText, isFirstMondayJst, jstHour, lawSignature, newRevisions, sha256 } from "../../src/watch/check.ts";
import { SOURCES } from "../../src/watch/sources.ts";
import { digestMail, dueSources } from "../../src/worker/watch.ts";

test("htmlText: サイト共通の部分とスクリプト・閲覧数は比べない", () => {
  const a = htmlText(`<html><head><style>p{}</style><script>var t=${Date.now()}</script></head><body><header>メニュー</header><main><h1>使用開始届</h1><p>7日前&nbsp;まで</p><!-- x --></main><footer>©</footer><p>閲覧数：1,234</p></body></html>`);
  const b = htmlText(`<html><body><header>別のメニュー</header><main><h1>使用開始届</h1><p>7日前 まで</p></main><nav>a</nav><p>閲覧数: 99</p></body></html>`);
  assert.equal(a, b);
  assert.match(a, /使用開始届 7日前 まで/);
  assert.notEqual(htmlText("<p>7日前まで</p>"), htmlText("<p>4日前まで</p>"));
});

test("sha256: 文字列と同じバイト列で同じ値", async () => {
  assert.equal(await sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(await sha256(new TextEncoder().encode("abc").buffer as ArrayBuffer), await sha256("abc"));
});

const rev = (id: string, date: string, status = "CurrentEnforced") => ({
  law_revision_id: id,
  amendment_law_title: `改正${id}`,
  amendment_law_num: `令和八年総務省令第${id}号`,
  amendment_enforcement_date: date,
  current_revision_status: status,
});

test("e-Gov: 改正が増えたら署名が変わり、増えた改正だけを新しい順に書く", () => {
  const before = [rev("1", "2025-10-01", "PreviousEnforced"), rev("2", "2026-06-26")];
  const after = [rev("3", "2027-04-01", "UnenforcedFuture"), ...before];
  const prev = lawSignature(before);
  assert.equal(lawSignature([...before].reverse()), prev);
  assert.notEqual(lawSignature(after), prev);
  assert.deepEqual(newRevisions(prev, after), ["改正3（令和八年総務省令第3号）施行 2027-04-01（未施行）"]);
});

test("compare: 初回は記録だけ、同じなら何もしない、違えば変更", () => {
  assert.deepEqual(compare(null, "x", "d"), { type: "baseline" });
  assert.deepEqual(compare("x", "x", "d"), { type: "same" });
  assert.deepEqual(compare("x", "y", "d"), { type: "changed", detail: "d" });
});

test("時刻: 日本時間で判定する", () => {
  assert.equal(jstHour(Date.UTC(2026, 10, 2, 0, 0)), 9); // 2026-11-02 9:00 JST
  assert.equal(isFirstMondayJst(Date.UTC(2026, 10, 2, 0, 0)), true); // 11/2 は月曜
  assert.equal(isFirstMondayJst(Date.UTC(2026, 10, 9, 0, 0)), false);
  assert.equal(isFirstMondayJst(Date.UTC(2026, 10, 1, 16, 0)), true); // UTC は日曜でも JST は月曜 1時
});

test("台帳: 法令4件と条例・規則のページがあり、ID が重複しない", () => {
  assert.equal(new Set(SOURCES.map((s) => s.id)).size, SOURCES.length);
  assert.equal(new Set(SOURCES.map((s) => s.url)).size, SOURCES.length);
  assert.deepEqual(SOURCES.filter((s) => s.kind === "egov").map((s) => s.title), ["消防法", "消防法施行令", "消防法施行規則", "危険物の規制に関する政令"]);
  for (const url of [
    "https://www1.g-reiki.net/chiba/reiki_honbun/g002RG00000705.html",
    "https://www.city.sapporo.jp/ncms/reiki/d1w_reiki_nonframe/H348901010034/H348901010034_j.html",
    "https://www.city.fukuoka.lg.jp/d1w_reiki/reiki_honbun/q003RG00000988.html",
    "https://www.city.nagoya.jp/bousai/shoubou/1013208/1013336.html",
    "https://www1.g-reiki.net/kyoto/reiki_honbun/k102RG00000940.html",
    "https://www.reiki.metro.tokyo.lg.jp/reiki/reiki_honbun/g101RG00002311.html",
    "https://cgi.city.yokohama.lg.jp/somu/reiki/reiki_honbun/g202RG00001081.html",
  ])
    assert.ok(SOURCES.some((s) => s.url === url && s.kind === "page"), url);
  assert.ok(SOURCES.filter((s) => s.kind === "manual").every((s) => /legal-square/.test(s.url)));
  assert.ok(SOURCES.every((s) => !/todokede\.jp/.test(s.url)));
});

test("dueSources: 一度も見ていないもの → 古いもの の順に、手で確かめる資料は除いて取る", () => {
  const now = Date.UTC(2026, 10, 2);
  const auto = SOURCES.filter((s) => s.kind !== "manual");
  const snaps = new Map(auto.map((s, i) => [s.id, { source_id: s.id, signature: "x", checked_at: now - (i < 3 ? CHECK_INTERVAL_MS + i : 1000), fail_count: 0 }]));
  snaps.delete(auto[5].id);
  const due = dueSources(snaps, now, 10);
  assert.deepEqual(due.map((s) => s.id), [auto[5].id, auto[2].id, auto[1].id, auto[0].id]);
  assert.equal(dueSources(new Map(), now).length, 20);
});

test("digestMail: 変更・取得不可・月次の手動確認をまとめる。何もなければ送らない", () => {
  assert.equal(digestMail([], []), null);
  const s = SOURCES.find((x) => x.kind === "page")!;
  const m = digestMail(
    [
      { source_id: s.id, kind: "changed", detail: "本文が変わった", detected_at: Date.UTC(2026, 10, 2) },
      { source_id: "egov-336M50000008006", kind: "error", detail: "3回続けて取れない", detected_at: Date.UTC(2026, 10, 2) },
    ],
    SOURCES.filter((x) => x.kind === "manual"),
  )!;
  assert.match(m.subject, /変更1件・取得不可1件・月次の手動確認/);
  assert.ok(m.text.includes(s.url));
  assert.match(m.text, /消防法施行規則/);
  assert.match(m.text, /手で確かめる資料/);
});
