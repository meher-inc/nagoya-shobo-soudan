-- 判定・回答の根拠にした一次情報（src/watch/sources.ts）の見張り。src/worker/watch.ts
-- 動かすのは WATCH_SOURCES=1 の Worker（名古屋）だけ。ほかの都市版では空のまま
CREATE TABLE IF NOT EXISTS source_snapshots (
  source_id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  -- 比べる値。page は本文の SHA-256、egov は改正履歴の ID の一覧
  signature TEXT,
  checked_at INTEGER NOT NULL,
  changed_at INTEGER,
  fail_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

-- 変わった・取れなくなった、の記録。notified_at が空のものを毎朝9時（日本時間）にまとめてメールする
CREATE TABLE IF NOT EXISTS source_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  kind TEXT NOT NULL, -- changed / error
  detail TEXT NOT NULL,
  detected_at INTEGER NOT NULL,
  notified_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_source_events_pending ON source_events (notified_at);
