// 判定・回答の根拠にした一次情報（条例・規則・様式のページ、国の法令）の変更を見張る。
// Cron Trigger（wrangler.jsonc の triggers）で毎時動き、7日以上見ていない資料を BATCH_SIZE 件ずつ取りに行く。
// 変わったら source_events に記録し、日本時間の9時の実行でまとめて NOTIFY_TO にメールする。
// 判定（src/rules）は自動では書き換えない。条文を確かめてから PR で直す（「法令・行政の内容は一次情報で確認してから書く」）。
// 動かすのは WATCH_SOURCES=1 の Worker（名古屋）だけ。src/rules は全版で同じなので、1か所で見れば足りる。
import { BATCH_SIZE, CHECK_INTERVAL_MS, FAIL_ALERT_AT, compare, htmlText, isFirstMondayJst, jstHour, lawSignature, newRevisions, sha256, type LawRevision } from "../watch/check.ts";
import { SOURCES } from "../watch/sources.ts";
import type { Source } from "../watch/types.ts";
import type { Env } from "./env.ts";

const UA = "TodokedeAI-SourceWatch/1.0 (+https://ai.todokede.jp)";
const TIMEOUT_MS = 20_000;

interface Snapshot {
  source_id: string;
  signature: string | null;
  checked_at: number;
  fail_count: number;
}

/** 取ってきて、比べる値と「何が変わったか」の1行を返す */
async function observe(s: Source): Promise<{ signature: string; detail: (prev: string | null) => string }> {
  const res = await fetch(s.url, {
    headers: { "user-agent": UA, accept: s.kind === "egov" ? "application/json" : "*/*" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (s.kind === "egov") {
    const body = (await res.json()) as { revisions?: LawRevision[] };
    const revisions = body.revisions ?? [];
    if (!revisions.length) throw new Error("改正履歴が空");
    return {
      signature: lawSignature(revisions),
      detail: (prev) => {
        const added = newRevisions(prev, revisions);
        return added.length ? `改正が追加: ${added.join(" / ")}` : "改正履歴が変わった（追加なし、削除または訂正）";
      },
    };
  }
  const type = res.headers.get("content-type") ?? "";
  if (/html|text\/plain/i.test(type)) {
    const text = htmlText(await res.text());
    if (text.length < 50) throw new Error("本文がほとんどない");
    return { signature: await sha256(text), detail: () => "本文が変わった" };
  }
  // PDF など: 中身そのもの
  return { signature: await sha256(await res.arrayBuffer()), detail: () => "ファイルが差し替わった" };
}

/** 次に見に行く資料（一度も見ていないもの → 古いもの） */
export function dueSources(snapshots: Map<string, Snapshot>, now: number, limit = BATCH_SIZE): Source[] {
  return SOURCES.filter((s) => s.kind !== "manual")
    .filter((s) => {
      const snap = snapshots.get(s.id);
      return !snap || now - snap.checked_at >= CHECK_INTERVAL_MS;
    })
    .sort((a, b) => (snapshots.get(a.id)?.checked_at ?? 0) - (snapshots.get(b.id)?.checked_at ?? 0))
    .slice(0, limit);
}

export async function checkBatch(env: Env, now: number): Promise<{ checked: number; changed: number; failed: number }> {
  const rows = (await env.DB.prepare("SELECT source_id, signature, checked_at, fail_count FROM source_snapshots").all<Snapshot>()).results;
  const snapshots = new Map(rows.map((r) => [r.source_id, r]));
  let changed = 0;
  let failed = 0;
  const due = dueSources(snapshots, now);
  for (const s of due) {
    const prev = snapshots.get(s.id);
    try {
      const { signature, detail } = await observe(s);
      const out = compare(prev?.signature ?? null, signature, detail(prev?.signature ?? null));
      await env.DB.prepare(
        `INSERT INTO source_snapshots (source_id, url, signature, checked_at, changed_at, fail_count, last_error)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, NULL)
         ON CONFLICT(source_id) DO UPDATE SET url = ?2, signature = ?3, checked_at = ?4,
           changed_at = COALESCE(?5, changed_at), fail_count = 0, last_error = NULL`,
      )
        .bind(s.id, s.url, signature, now, out.type === "changed" ? now : null)
        .run();
      if (out.type === "changed") {
        changed++;
        await env.DB.prepare("INSERT INTO source_events (source_id, kind, detail, detected_at) VALUES (?, 'changed', ?, ?)").bind(s.id, out.detail, now).run();
      }
    } catch (e) {
      failed++;
      const message = String(e instanceof Error ? e.message : e).slice(0, 200);
      const count = (prev?.fail_count ?? 0) + 1;
      // 取れなかったときも checked_at を進める（同じ資料ばかり取りに行かない）。署名は前回のまま
      await env.DB.prepare(
        `INSERT INTO source_snapshots (source_id, url, signature, checked_at, fail_count, last_error)
         VALUES (?1, ?2, NULL, ?3, 1, ?4)
         ON CONFLICT(source_id) DO UPDATE SET url = ?2, checked_at = ?3, fail_count = fail_count + 1, last_error = ?4`,
      )
        .bind(s.id, s.url, now, message)
        .run();
      if (count === FAIL_ALERT_AT)
        await env.DB.prepare("INSERT INTO source_events (source_id, kind, detail, detected_at) VALUES (?, 'error', ?, ?)")
          .bind(s.id, `${FAIL_ALERT_AT}回続けて取れない（${message}）。URL が変わったか、取得を拒否されている`, now)
          .run();
    }
  }
  console.log("source_watch", { checked: due.length, changed, failed });
  return { checked: due.length, changed, failed };
}

const byId = new Map(SOURCES.map((s) => [s.id, s]));

export function digestMail(events: { source_id: string; kind: string; detail: string; detected_at: number }[], manual: Source[]): { subject: string; text: string } | null {
  if (!events.length && !manual.length) return null;
  const line = (e: (typeof events)[number]) => {
    const s = byId.get(e.source_id);
    const date = new Date(e.detected_at + 9 * 3600_000).toISOString().slice(0, 10);
    return [`・${s?.title ?? e.source_id}（${s?.jurisdictions.join("・") ?? "不明"}）`, `  ${e.detail}（${date} 検知）`, `  ${s?.url ?? ""}`].join("\n");
  };
  const changed = events.filter((e) => e.kind === "changed");
  const errors = events.filter((e) => e.kind === "error");
  const parts: string[] = [];
  if (changed.length) parts.push("■ 変わった資料", "条文・様式・期限が変わっていないかを確かめ、変わっていれば src/rules・評価セット・prompt を直して全リポジトリに同期してください。", "", ...changed.map(line), "");
  if (errors.length) parts.push("■ 取れなくなった資料", "URL を確かめ、notes.md と src/rules のコメントを直したうえで node scripts/build-sources.mjs を実行してください。", "", ...errors.map(line), "");
  if (manual.length)
    parts.push(
      "■ 手で確かめる資料（月1回）",
      "検索フォーム経由でしか開けない例規集です。「内容現在」の日付が notes.md の記載より新しくなっていないかを見てください。",
      "",
      ...manual.map((s) => `・${s.title}（${s.jurisdictions.join("・")}）\n  ${s.url}`),
      "",
    );
  parts.push("この通知は nagoya-shobo-soudan の src/worker/watch.ts が送っています。台帳は src/watch/sources.ts。");
  const counts = [changed.length && `変更${changed.length}件`, errors.length && `取得不可${errors.length}件`, manual.length && "月次の手動確認"].filter(Boolean).join("・");
  return { subject: `【トドケデ AI】根拠の一次情報の見張り（${counts}）`, text: parts.join("\n") };
}

/** 日本時間の9時に、未通知の記録をまとめて送る。月の最初の月曜は手で確かめる資料の一覧も付ける */
export async function sendDigest(env: Env, now: number): Promise<boolean> {
  const events = (
    await env.DB.prepare("SELECT id, source_id, kind, detail, detected_at FROM source_events WHERE notified_at IS NULL ORDER BY detected_at LIMIT 90").all<{
      id: number;
      source_id: string;
      kind: string;
      detail: string;
      detected_at: number;
    }>()
  ).results;
  const manual = isFirstMondayJst(now) ? SOURCES.filter((s) => s.kind === "manual") : [];
  const mail = digestMail(events, manual);
  if (!mail) return false;
  if (!env.EMAIL || !env.NOTIFY_FROM || !env.NOTIFY_TO) {
    console.log("source_watch_digest_skipped", mail.subject);
    return false;
  }
  for (const to of env.NOTIFY_TO.split(",").map((s) => s.trim()).filter(Boolean))
    await env.EMAIL.send({ to, from: { email: env.NOTIFY_FROM, name: "トドケデ AI" }, subject: mail.subject, text: mail.text });
  if (events.length)
    await env.DB.prepare(`UPDATE source_events SET notified_at = ? WHERE id IN (${events.map(() => "?").join(",")})`)
      .bind(now, ...events.map((e) => e.id))
      .run();
  console.log("source_watch_digest_sent", mail.subject);
  return true;
}

export async function runWatch(env: Env, now: number) {
  if (env.WATCH_SOURCES !== "1") return;
  await checkBatch(env, now);
  if (jstHour(now) === 9) await sendDigest(env, now);
}
