# 堺市版 調査メモ（2026-10-20）

## 使った一次情報（すべて 2026-10-20 確認）

| 内容 | URL | 更新日・版 |
|---|---|---|
| 堺市火災予防条例（第84条〜第91条、第35条・第38条、附則） | https://www.city.sakai.lg.jp/reiki/reiki_honbun/s000RG00000999.html | 令和8年3月27日条例第1号まで |
| 堺市火災予防条例施行規則（第6条〜第13条、附則） | https://www.city.sakai.lg.jp/reiki/reiki_honbun/s000RG00001052.html | 令和8年規則第19号まで |
| 例規集 体系目次（第16編第5章 火災予防） | https://www.city.sakai.lg.jp/reiki/reiki_taikei/r_taikei_16_05.html | - |
| 消防局の各消防署（住所・電話・所管業務） | https://www.city.sakai.lg.jp/shisei/gaiyo/annai/gyoseikiko/shobo/index.html | 各署 2026-04-01 |
| あなたの街の消防署（各署の管轄区域） | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shokai/shobosho/index.html | 2019-02-21〜2026-01-05 |
| 申請・届出用紙（電子申請・メール・郵送） | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shinsei/index.html | 閲覧日 2026-10-20 |
| 東及び南消防署の届出先変更 | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shinsei/todokedehenkounituite.html | 2023-06-06 |
| 防火対象物使用開始（変更）届出書 | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shinsei/jorei/bokataishobutsu.html | 2025-10-17 |
| 炉・厨房設備等設置（変更）届出書 | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shinsei/jorei/chubosecchi.html | 2026-03-31 |
| 露店等の開設届出書 | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shinsei/jorei/rotenkaisetsu.html | 2025-10-17 |
| 少量危険物・指定可燃物 届出書 | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shinsei/jorei/shoryokikenbutsu.html | 2021-10-05 |
| 自衛消防訓練等実施通知書 | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shinsei/kunren/jieisyouboukunnrenn.html | 2025-09-09 |
| 消防協力事業所（管轄が「堺市、高石市、大阪狭山市」と明記） | https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shinsei/kunren/31246520210323105340299.html | 2026-04-01 |
| 堺市市勢概要（消防）高石市・大阪狭山市の受託の経緯 | https://www.city.sakai.lg.jp/shigikai/koho/gikai_hakkoshiryo/04shiseigaiyo.files/04-11shobo1.pdf | 令和3年度版 |
| 大阪狭山市 報道資料（消防事務の委託に関する規約、施行日 令和3年4月1日） | https://www.city.osakasayama.osaka.jp/material/files/group/4/press0238.pdf | 令和2年10月 |

## 市外の管轄（高石市・大阪狭山市）

- 堺市消防局は、高石市（平成20年10月1日から）と大阪狭山市（令和3年4月1日から）の消防事務を受託している。消防署は9署（堺・中・東・西・南・北・美原・高石・大阪狭山）。
- 堺市火災予防条例の附則は、旧堺市高石市消防組合火災予防条例（附則第2項）と旧大阪狭山市火災予防条例（附則第9項〜第16項「大阪狭山市の消防事務の受託に伴う経過措置」）の手続を、この条例の相当規定によるものとみなしている。高石消防署・大阪狭山消防署の所管業務にも「堺市火災予防条例に基づく指導及び各種届出の受理」がある。このため、両市の区域にも堺市火災予防条例・同施行規則が適用されると判断した。
  - ただし、事務委託の規約の条文本文（委託事務の範囲）は読めていない（大阪狭山市の報道資料には規約名と施行日だけ）。「両市にも条例が適用される」は上の附則と所管業務からの判断で、規約の条文では確認していない。
- **都市版の対象地域の書き方（提案）**
  - service.ts の areaServed・serviceScope・description は「堺市」のままにした（サービス名が「堺市 消防相談AI」なので）。
  - prompt.ts には「高石市・大阪狭山市も堺市消防局の管轄で、堺市火災予防条例が適用される。提出先は高石消防署・大阪狭山消防署」と書き、両市の相談を断らずに案内させる。
  - stations.ts には高石消防署・大阪狭山消防署を ward「○○市（市外。堺市が消防事務を受託）」として載せた。
  - 依頼元で、areaServed を「大阪府堺市・高石市・大阪狭山市」に広げるか、serviceScope を「堺市消防局の管轄区域（堺市・高石市・大阪狭山市）」にするかを決めてほしい（利用規約に関わるので、このファイルでは変えていない）。

## 署の管轄と届出の受付の注意

- 区と署は基本1対1（堺区＝堺、中区＝中、東区＝東、西区＝西、南区＝南、北区＝北、美原区＝美原）。例外として、中区八田寺町の40-1から3は西消防署、南区太平寺の一部地番は南消防署（福泉出張所）が管轄する（各署の管轄区域ページ）。
- 令和5年4月1日から、東区の建物の消防設備・危険物規制関係の届出の一部は美原消防署、南区の建物の分は中消防署で受け付ける（使用開始届、炉・厨房設備等の設置届、少量危険物の届出、消防用設備等の着工・設計・設置届など。「✖」印の様式）。防火管理者の選任届などは従来どおり東・南消防署でも受け付ける。
- 使用開始届は「所轄消防署予防課又は消防局予防査察課設備係」で受け付ける（受付窓口の詳細はPDF uketukemadoguchikakusyosakaisyoiten.pdf。PDFの中身は読んでいない）。
- 露店等の開設届と自衛消防訓練等実施通知書は、管轄消防署の警防課で受け付ける。

## 判定（src/rules/cities/sakai.ts）で conditional・要確認にした項目

- 工事（renovation）: 条例に工事計画の届出はない。工事設計書（第91条、10日前）と現場事務所等（第86条第6号、3日前）を案内する conditional にした。
- 催物（event・temp_use）: 物品販売だけの一時使用が第86条第3号の「催物」にあたるかは所轄の判断。
- ボイラー: 入力の条件を FilingFacts で表せないため conditional。
- 使用開始届の提出先は条例上「消防長又は消防署長」。target はそのまま書いた。

## 確認できなかった項目

- 各消防署の予防課の直通番号（PDF「各消防署予防課」に載っているが、中身を読んでいないので載せていない）。stations.ts の電話は各署の代表番号。
- 堺市電子申請システムで受け付けている手続の一覧（電子申請システムのサイトは読んでいない）。prompt.ts には「多くの申請・届出（一部を除く）」とだけ書いた。
- 大阪狭山市・高石市との事務委託規約の条文本文。

## 名古屋市との違い

- 使用開始届の対象から(17)項（文化財など）も除く（名古屋市は(19)項・(20)項だけ除く）。使用開始前の検査の定めがある（条例第84条第2項）。
- 名古屋市は排気ダクトのある厨房設備がすべて対象だが、堺市は同一厨房室の入力合計350kW以上だけが対象。
- 消防訓練の届出（名古屋市条例第67条）と溶接・溶断の届出（同第69条第3号）は堺市にはない。訓練は「自衛消防訓練等実施通知書」で通知する運用。
- 堺市は期限を日数で決めている（設備5日前、たき火・催物・断水は前日、露店3日前、少量危険物5日前、工事設計書10日前）。
- 消防局が市外2市を管轄している。
