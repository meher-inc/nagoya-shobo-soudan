# 相模原市版 調査メモ（2026-10-20 確認）

## 使った一次情報
| 内容 | URL | 確認日 |
|---|---|---|
| 申請書メニュー「4 火災予防条例に関する書類」（各書類のページに根拠法令・届出等の時期・受付窓口） | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/index.html | 2026-10-20 |
| 4-3 防火対象物使用開始届出書（2024-04-01 更新） | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/1011915.html | 2026-10-20 |
| 4-4 火を使用する設備等の設置（変更）届出書（2024-03-29 更新） | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/1011917.html | 2026-10-20 |
| 4-5 急速充電設備・燃料電池発電設備・変電設備・発電設備・蓄電池設備設置届出書 | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/1011918.html | 2026-10-20 |
| 4-8 火煙発生届出書（2026-01-30 更新） | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/1011921.html | 2026-10-20 |
| 4-10 催物開催届出書 | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/1011923.html | 2026-10-20 |
| 4-11 水道断減水届出書 | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/1011924.html | 2026-10-20 |
| 4-13 露店等の開設届出書 | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/1011926.html | 2026-10-20 |
| 4-15 少量危険物・指定可燃物（貯蔵・取扱）開始（廃止）届出書 | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011914/1011928.html | 2026-10-20 |
| 2-1 消防訓練通報書（2026-04-09 更新） | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011988/1011898.html | 2026-10-20 |
| 3-2 消防用設備等工事計画書（2025-06-06 更新） | https://www.city.sagamihara.kanagawa.jp/shinseisho_menu/syoubo/1011903/1011905.html | 2026-10-20 |
| サウナ設備の基準等の変更について（2026-02-06 更新） | https://www.city.sagamihara.kanagawa.jp/kurashi/1026529/shobo/kasaiyobo/1008907/1034668.html | 2026-10-20 |
| 消防同意時のよくある主な確認事項（2025-11-07 更新） | https://www.city.sagamihara.kanagawa.jp/kurashi/1026529/shobo/kasaiyobo/1022662/1022664.html | 2026-10-20 |
| 相模原消防 電子申請 | https://www.city.sagamihara.kanagawa.jp/kurashi/1026529/shobo/1029635/index.html | 2026-10-20 |
| 消防局の概要（2026-05-28 更新） | https://www.city.sagamihara.kanagawa.jp/kurashi/1026529/shobo/shobokyoku/1008845.html | 2026-10-20 |
| 組織と業務「消防部」「警防部」（2026-04-01 更新） | https://www.city.sagamihara.kanagawa.jp/shisei/1026709/1000105/1025074/1022939.html、1022940.html | 2026-10-20 |

## 確認できなかった項目（conditional・要確認）
- **相模原市火災予防条例・同施行規則の条文本文。** 相模原市例規集（https://www.city.sagamihara.kanagawa.jp/shisei/1026766/reiki/index.html から http://krg211.legal-square.com/HAS-Shohin/page/SJSrbLogin.jsf）は検索フォームを送信しないと本文を開けない。CITY_BRIEF.md の「フォーム送信はしない」に従い読んでいない。条番号と期限は消防局の申請書ページの「根拠法令」「届出等の時期」による。条文で確かめたい（依頼元か、フォームの利用を認めてもらえれば再確認する）。
- 厨房設備が届出の対象になる入力の下限（第46条のどの号か、何kW以上か）。消防同意の確認事項に「業務用の厨房設備（概ね21キロワットを超えるもの）」は機器表を明示とあるが、届出の基準かは不明。判定は conditional。
- 蓄電池設備の容量の下限、変電設備・発電設備などの規模の下限。conditional。
- 一般サウナ設備（建物内）の届出の範囲（個人の住居の扱い）。簡易サウナ設備の扱いだけ公式ページで確認した。
- 少量危険物・指定可燃物の届出の対象になる量の下限（指定数量の5分の1以上か、個人の住居の扱い）。量がわかっている場合は conditional、わからない場合は required と caveat で返す。
- 届出先の長（消防長か消防署長か）と様式番号。form は空にしている（消防訓練通報書だけ名称を入れた）。
- 溶接・溶断作業の届出。申請書一覧にはないが、条例に定めがないことは本文で確認できていないので conditional。
- 一時使用の届出、工事計画の届出が条例にあるか。消防用設備等工事計画書（10日前）の根拠条も申請書ページにない。
- 露店等の届出が火気器具等を使う露店に限られるか。stall_fire が true のときだけ required、それ以外は conditional。
- 北消防署と津久井消防署の担当区域の境界の細部（城山・大沢・橋本地区／津久井・相模湖・藤野地区の範囲）。組織ページの「担当区域」の文言だけを写した。

## 管轄の説明
- 区は3つ（中央区・南区・緑区）、消防署は4つ。緑区は北消防署と津久井消防署で分かれる。
- 届出の窓口は各署の査察指導課。津久井消防署には査察指導課がなく、警備課の査察指導班が担当する。電話番号は stations.ts に査察指導課（津久井は警備課）を書いた。
- 予防課（消防部）は、開発事業基準条例等に基づき予防課と協議した新築防火対象物の届出だけを受け付ける。

## 名古屋市との違い
- 火を使用する設備等の設置届が「設備を設ける3日前」、火煙・催物・断減水・露店も3日前（名古屋市はあらかじめ）。
- 消防訓練は条例でなく国の規則の通報（消防法施行規則第3条第11項）として案内されている（名古屋市は条例第67条）。
- 溶接作業の届出は申請書一覧にない（名古屋市は条例第69条第3号）。
- 簡易サウナ設備（屋外のテント型・バレル型）の区分が令和8年3月31日から施行。個人が自宅で使うものは届出不要。
- 市外の管轄はない（市内4署）。
