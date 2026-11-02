# 京都市・東京都・名古屋市・大阪市・横浜市の判定の根拠（見張りの台帳用）

`src/rules/filings.ts` の5管轄は `cities/` に notes.md がないため、根拠の URL をここに置く。
`node scripts/build-sources.mjs` がこの表を読み、`src/watch/sources.ts` に入れる（1列目が地域）。

| 地域 | 資料 | URL | 確認 |
|---|---|---|---|
| kyoto | 京都市火災予防条例（第7章 雑則 第55条〜第62条）京都市例規集 Reiki-Base | https://www1.g-reiki.net/kyoto/reiki_honbun/k102RG00000940.html | 2026-11-02 本文と章立てを確認 |
| kyoto | 京都市火災予防規則（第10条〜第15条） | https://www1.g-reiki.net/kyoto/reiki_honbun/k102RG00000941.html | 2026-11-02 検索で題名のみ確認 |
| tokyo | 火災予防条例（東京都例規集。第56条〜第60条） | https://www.reiki.metro.tokyo.lg.jp/reiki/reiki_honbun/g101RG00002311.html | 2026-11-02（東京版 src/ingest/sources.ts と同じ） |
| tokyo | 火災予防条例施行規則（東京都例規集） | https://www.reiki.metro.tokyo.lg.jp/reiki/reiki_honbun/g101RG00002312.html | 2026-11-02（同上） |
| nagoya | 火災予防条例（昭和37年条例第16号、令和8年第7号まで）名古屋市消防局の令和8年版 PDF | https://www.city.nagoya.jp/_res/projects/default_project/_page_/001/013/182/r8jyourei.pdf | 2026-11-02 |
| nagoya | 火災予防条例指導基準（条例 PDF の掲載ページ。年度版の差し替えを見る） | https://www.city.nagoya.jp/shobo/page/0000142287.html | 2026-11-02（2026-04-22 更新） |
| nagoya | 名古屋市例規類集（検索システム。消防法等施行細則の本文） | https://kri502.legal-square.com/HAS-Shohin/page/SJSrbLogin.jsf | 2026-11-02 市の「条例・規則・公報」ページのリンク |
| yokohama | 横浜市火災予防条例（昭和48年条例第70号）第73条〜第76条 | https://cgi.city.yokohama.lg.jp/somu/reiki/reiki_honbun/g202RG00001081.html | 2026-11-02 |
| yokohama | 横浜市火災予防規則（昭和49年規則第23号、令和8年規則第18号まで）第29条〜第35条（第35条 5日前まで） | https://cgi.city.yokohama.lg.jp/somu/reiki/reiki_honbun/g202RG00001082.html | 2026-11-02 |

## 未登録
- 大阪市火災予防条例・同施行規則の本文: 大阪市の例規データベースの条文ページの URL を確かめられていない（消防局の例規集 ops-jg.d1-law.com は検索画面経由）。大阪の届出の運用は cities/osaka/notes.md の消防局ページで見ている
- 京都市の例規集は d1-law.com（en3-jg.d1-law.com/kyoto）にもあるが、robots.txt で取得が禁止されているので見張らない
