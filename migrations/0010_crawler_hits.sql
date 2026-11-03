-- 検索エンジンと生成AIのクローラーの来訪数（GEO・SEO の計測）。src/worker/crawlers.ts
-- 日本時間の日付・クローラー名・ページの種類ごとの件数だけを持つ。IP や User-Agent の全文は残さない
CREATE TABLE IF NOT EXISTS crawler_hits (
  day TEXT NOT NULL,      -- YYYY-MM-DD（日本時間）
  bot TEXT NOT NULL,      -- crawlers.ts の BOTS の name
  kind TEXT NOT NULL,     -- ai（生成AI）/ search（検索エンジン）
  page TEXT NOT NULL,     -- home / soudan / llms / sitemap / robots / other
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, bot, page)
);
