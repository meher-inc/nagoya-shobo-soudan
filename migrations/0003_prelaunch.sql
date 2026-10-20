-- 匿名利用の IP 単位の日次上限。IP は日ごとに作り直す鍵で HMAC した値だけを保存する（元の IP は保存しない）
CREATE TABLE ip_daily_usage (
  ip_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);

-- HMAC の鍵。ip:<日付> は日ごと（2 日後に削除）、account は退会者の照合用で固定
CREATE TABLE hash_keys (
  name TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- 退会後に同じ Google アカウントで再登録しても無料期間を復活させないための記録（3 年で削除）。
-- Google アカウントの識別子は HMAC した値だけを残し、メールアドレス等は残さない。時刻はミリ秒
CREATE TABLE deleted_accounts (
  sub_hash TEXT PRIMARY KEY,
  trial_started_at INTEGER,
  deleted_at INTEGER NOT NULL
);

-- 管理画面の日別集計（個人を特定しない件数のみ）
CREATE TABLE daily_metrics (
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind)
);

-- 送信時に記録する同意の版と日時、無料期間の 24 時間を過ぎてから最初に再訪した日時（再訪数を 1 人 1 回だけ数える）
ALTER TABLE users ADD COLUMN consent_version TEXT;
ALTER TABLE users ADD COLUMN consent_at INTEGER;
ALTER TABLE users ADD COLUMN revisited_at INTEGER;

-- 鍵なしの IP のハッシュを残す旧方式（1 IP あたりの無料開始数）はやめた（列は残すが書き込まない）
DROP INDEX IF EXISTS idx_users_anon_ip;
UPDATE users SET ip_hash = NULL;
