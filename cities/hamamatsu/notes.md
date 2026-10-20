# 浜松市版 調査メモ（2026-10-20）

## 使った一次情報（すべて 2026-10-20 確認）

| 内容 | URL | 更新日・版 |
|---|---|---|
| 浜松市火災予防条例（第43条〜第46条、第28条） | https://www1.g-reiki.net/hamamatsu/reiki_honbun/o700RG00000615.html | 令和8年3月31日施行版 |
| 浜松市火災予防規則（第14条〜第20条） | https://www1.g-reiki.net/hamamatsu/reiki_honbun/o700RG00000616.html | 令和8年4月1日施行版 |
| 浜松市火災予防条例 解説（例規集・規則へのリンク元） | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/20260101tikujyoukaisetu.html | 2026-03-02 |
| 消防局 組織案内（署の住所・電話、予防課） | https://www.city.hamamatsu.shizuoka.jp/koho2/sosiki/other-office001.html | 2026-07-06 |
| 消防署の町別管轄 | https://www.city.hamamatsu.shizuoka.jp/hfdsoum/disaster/shobo/kankatsu/index.html | 2025-03-31（町名別ページは 2026-03-31） |
| 消防署の町別管轄表（PDF） | https://www.city.hamamatsu.shizuoka.jp/documents/5837/kankatsuhyou.pdf | 日付の記載なし |
| 防火対象物使用開始届出をするときは | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/disaster/shobo/service/siyokaisi/siyokaisi001.html | 2025-06-09 |
| 火災予防などに関する電子申請サービスについて | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/20221222.html | 2026-01-05 |
| 火を使用する設備等の設置届出書の様式 | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/disaster/shobo/service/kaki/kaki000.html | 2026-03-30 |
| 火災とまぎらわしい行為の届出 | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/disaster/shobo/service/takibi/takibi001.html | 2025-12-25 |
| 催物開催の届出 | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/disaster/shobo/service/saibutu/saibutu001.html | 2024-04-02 |
| 露店等の開設の届出 | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/disaster/shobo/service/roten/roten.html | 2024-04-02 |
| 水道の断水又は減水の届出 | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/disaster/shobo/service/takibi/suidounodansui.html | 2026-10-14 |
| 消防用設備等計画書について | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/setsubikeikaku.html | 2025-12-25 |
| 少量危険物等の届出書等の様式 | https://www.city.hamamatsu.shizuoka.jp/hfdyobo/disaster/shobo/service/syoryo/syoryo000.html | 2024-04-02 |

## 消防署の管轄（2024年1月の区の再編後）

- 区の再編後も消防署は7署で、署名は旧区名のまま（中・東・西・南・北・浜北・天竜）。
- 町名50音順ページの全543行を集計した結果、区と署の組合せは次の7通りだけだった。
  - 中央区: 中消防署 177・南消防署 78・東消防署 61・西消防署 48
  - 浜名区: 北消防署 56・浜北消防署 46
  - 天竜区: 天竜消防署 77
- 管轄表（PDF）の「行政区との関係」欄の地区名を stations.ts の ward に写した。1つの区を複数の署が持つので、区名だけで署を決めず、町名で町別管轄ページを確認するよう prompt.ts に書いた。
- 北消防署は浜名区（細江町）に、東・西・南消防署は中央区にある。署名から区を推測しないこと。

## 判定（src/rules/cities/hamamatsu.ts）で conditional・要確認にした項目

- 工事（renovation）: 条例に工事計画の届出がない。第43条には使用開始届の「変更」の定めがない（名古屋・堺・大阪は変更も届出）。用途を変えるときに出し直すかは要確認。
- 催物（event・temp_use）: 物品販売だけの一時使用が第45条第3号の「催物」にあたるかは所轄の判断。
- ボイラー: 入力の条件（給湯湯沸設備は70kW以上、ボイラーは入力の条件なし）を FilingFacts で表せないため conditional。
- 少量危険物: 規則第18条に提出期限の日数がない（条例の「あらかじめ」だけ）。
- 指定可燃物の数量の5倍の判定は FilingFacts で表せないため、少量危険物と同じ扱い。

## 確認できなかった項目

- 各消防署の予防課の直通電話番号（組織案内には本署の代表番号だけ）。
- 出張所で使用開始届などを受け付けるかは、使用開始届のページに「消防署又は出張所」とあるが、ほかの届出のページも同じ扱いかは個別に確認していない。
- 電子申請の対象に、防火対象物使用開始届と火を使用する設備（炉・厨房設備など）の設置届は一覧に載っていなかった（2026-10-20 時点）。今後追加される可能性がある（「順次、追加予定」と書かれている）。
- 断水・減水の届出のページの問い合わせ先は警防課（053-475-7531）。提出先は管轄の消防署又は出張所。

## 名古屋市との違い

- 使用開始届の期限は同じ7日前だが、様式は第3号様式で、正本・副本の2部を出す。
- 名古屋市は排気ダクトのある厨房設備がすべて対象だが、浜松市は同一厨房室の入力合計350kW以上だけが対象。
- 消防訓練の届出（名古屋市条例第67条）と溶接・溶断の届出（同第69条第3号）は浜松市にはない。
- 名古屋市の届出は「あらかじめ」が多いが、浜松市は規則第15条・第16条で日数（7日前・3日前）を決めている。
- 露店の届出は「屋外での催し」に限られる（条例第45条第6号）。
