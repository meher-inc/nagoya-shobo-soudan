// 一次情報の変更検知の中身（Worker にも node:test にも依存しない純粋な関数）。
// 取りに行くのは src/worker/watch.ts。ここは「取ってきたものから比べる値（署名）を作る」と「前回と比べる」だけ。

/** 同じ資料を週1回見に行く間隔（ミリ秒）。少し短くして、毎週同じ時刻の実行で必ず当たるようにする */
export const CHECK_INTERVAL_MS = 6.5 * 24 * 60 * 60 * 1000;
/** 1回の実行で取りに行く資料の数（Worker の CPU 時間とサブリクエストの上限の内側に収める） */
export const BATCH_SIZE = 20;
/** 続けて取れなかったら知らせる回数 */
export const FAIL_ALERT_AT = 3;

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

/**
 * HTML から本文の文字だけを取り出す。スクリプト・スタイル・ヘッダー・フッター・ナビ（サイト共通の部分）と、
 * 閲覧数や「現在の日時」のように毎回変わる部分は比べない。
 */
export function htmlText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg|header|footer|nav)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/(閲覧数|アクセス数|ページビュー)[:：]?\s*[\d,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sha256(data: string | ArrayBuffer): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** e-Gov 法令API v2 の /api/2/law_revisions/<法令ID> の改正1件 */
export interface LawRevision {
  law_revision_id: string;
  law_title?: string | null;
  amendment_law_title?: string | null;
  amendment_law_num?: string | null;
  amendment_promulgate_date?: string | null;
  amendment_enforcement_date?: string | null;
  amendment_scheduled_enforcement_date?: string | null;
  current_revision_status?: string | null;
}

/** 改正履歴の署名。改正（未施行の改正を含む）が1件でも増えれば変わる */
export function lawSignature(revisions: LawRevision[]): string {
  return revisions.map((r) => r.law_revision_id).sort().join("\n");
}

/** 前回の署名になかった改正を、施行日の新しい順に並べて文にする */
export function newRevisions(prevSignature: string | null, revisions: LawRevision[]): string[] {
  const seen = new Set((prevSignature ?? "").split("\n").filter(Boolean));
  return revisions
    .filter((r) => !seen.has(r.law_revision_id))
    .sort((a, b) => String(b.amendment_enforcement_date ?? "").localeCompare(String(a.amendment_enforcement_date ?? "")))
    .map((r) => {
      const status = r.current_revision_status === "UnenforcedFuture" || r.current_revision_status === "Unenforced" ? "（未施行）" : "";
      const when = r.amendment_enforcement_date ?? r.amendment_scheduled_enforcement_date ?? "施行日未定";
      return `${r.amendment_law_title ?? "改正"}（${r.amendment_law_num ?? "番号不明"}）施行 ${when}${status}`;
    });
}

export type Outcome =
  | { type: "baseline" } // 初めて取れた。比べる相手がないので記録だけ
  | { type: "same" }
  | { type: "changed"; detail: string };

/** 前回の署名と比べる。detail はメールに書く1行 */
export function compare(prev: string | null, next: string, detail: string): Outcome {
  if (prev === null) return { type: "baseline" };
  if (prev === next) return { type: "same" };
  return { type: "changed", detail };
}

/** 日本時間の今日が「その月の最初の月曜」か（手で確かめる資料の一覧を月1回送る日） */
export function isFirstMondayJst(now: number): boolean {
  const d = new Date(now + 9 * 60 * 60 * 1000);
  return d.getUTCDay() === 1 && d.getUTCDate() <= 7;
}

/** 日本時間の時（0〜23） */
export function jstHour(now: number): number {
  return new Date(now + 9 * 60 * 60 * 1000).getUTCHours();
}
