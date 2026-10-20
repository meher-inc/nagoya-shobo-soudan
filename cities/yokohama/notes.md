# 横浜市（yokohama-city）調査メモ

確認日: 2026-10-20

届出の判定は src/rules/filings.ts の yokohama() に既にあるため、この作業では成果物1・2（rules/cities/yokohama.ts とそのテスト）は作っていない。filings.ts も編集していない。

## 使った一次情報

| 内容 | URL | 時点 |
|---|---|---|
| 届出様式ダウンロード（届出ごとの根拠条・期限の説明） | https://www.city.yokohama.lg.jp/bousai-kyukyu-bohan/shobo/download.html | 2025-06-30 更新 |
| 火災予防分野の電子申請 | https://www.city.yokohama.lg.jp/bousai-kyukyu-bohan/shobo/shinsei/20221209111121255.html | 2024-07-30 更新 |
| 消防局 予防課 | https://www.city.yokohama.lg.jp/city-info/yokohamashi/org/shobo/soshiki-gyomu/yobou.html | 2025-06-27 更新 |
| 消防局 指導課 | https://www.city.yokohama.lg.jp/city-info/yokohamashi/org/shobo/soshiki-gyomu/shidou.html | 2025-06-24 更新 |
| 消防局の組織と業務（各消防署へのリンク） | https://www.city.yokohama.lg.jp/city-info/yokohamashi/org/shobo/soshiki-gyomu/index.html | 確認日時点 |
| 各消防署の総務・予防課（18署） | 例 https://www.city.yokohama.lg.jp/city-info/yokohamashi/org/shobo/soshiki-gyomu/tsurumi-shobo/somu-yobou.html | 2025-03-26〜2026-04-21 更新（署ごと） |
| 消防局・消防署・消防出張所の配置 | https://www.city.yokohama.lg.jp/kurashi/bousai-kyukyu-bohan/shobo/shokainado/adress.html | 2025-10-03 更新 |
| 横浜市火災予防規則の一部改正について（サウナ設備の様式） | https://www.city.yokohama.lg.jp/city-info/yokohamashi/org/shobo/sonota/ikenkoubo/sauna_kisoku.html | 2026-03-25 |

各署のページは、丸岡さんの PC の内蔵ブラウザで「消防局の組織と業務」を開き、同じサイトの各署の総務・予防課ページから所在地と電話番号を取り出した。

## prompt.ts と yokohama() の対応

| prompt の記述 | yokohama() の根拠 | 公式ページでの確認 |
|---|---|---|
| 使用開始届は使用開始日の7日前まで、第8号様式 | 条例第73条、規則第29条 | 届出様式ダウンロード（第73条・7日前）で確認 |
| 火を使用する設備等の設置届、厨房350kW以上、蓄電池20kWh超は電気設備設置届、使用前検査 | 条例第74条・第74条第2項、規則第30条 | 届出様式ダウンロード（第74条）で確認。350kW・20kWh・検査は yokohama() による |
| 煙火（第75条第2号）・催物（第3号）・露店（第7号）・火煙発生届・断水・道路工事は第75条 | 条例第75条、規則第31条 | 届出様式ダウンロードで確認 |
| 火煙・催物・露店・断水は実施する日の5日前まで | 規則第35条 | yokohama() による（下記） |
| 断水区域が2以上の消防署にわたるときは消防長 | 条例第75条ただし書 | yokohama() による |
| 少量危険物・指定可燃物は第76条、5分の1以上（住居2分の1以上） | 条例第76条、規則第32条 | 届出様式ダウンロード（第76条）で確認。割合は yokohama() による |
| 設置等計画届（条例第78条）は建築工事に着手する前 | 条例第78条、規則第34条 | 届出様式ダウンロードで確認 |
| 溶接作業の届出はない。消火・避難訓練は事前に電話等で消防署へ | noProvision・drillNational | 届出様式ダウンロード（消防法施行規則第3条、電話等で連絡）で確認 |

## 確認できなかった項目（要確認）

- 横浜市火災予防規則の条文本文（第29条〜第35条）は、この作業では読み直していない。規則第35条の「5日前まで」と様式番号（第8号・第9号・第10号・第12号・第14号・第15号・第16号の2・第17号様式）は、filings.ts の yokohama() に書かれた確認結果（2026-10-20）をそのまま使っている。例規集のURLを公式サイトから取り出せなかった（市の例規ページの取得でエラー）。
- 各消防署の予防の窓口は「総務・予防課」で、電話番号は本署の代表番号（〜-0119）と同じ番号が載っている。予防専用の直通番号は公式ページにない。
- 「横浜市内の消防署」一覧ページと各署の紹介ページには住所・電話が載っていない。stations.ts は各署の総務・予防課ページの所在地を使った（区総合庁舎内の署は、庁舎名と階まで載っている）。

## 名古屋市との違い

- 工事計画届（名古屋市第66条の2）はない。代わりに、5階以上・延べ3,000㎡超などの建物で建築工事により消防用設備等を設ける場合の設置等計画届（条例第78条）がある。
- 消防訓練・溶接作業の届出は条例にない。訓練は国の規則に基づいて事前に電話等で連絡する、と消防局が案内している。
- 名古屋市は排気ダクト等のある厨房設備をすべて届出対象にしているが、横浜市は350kW以上だけ。
- 断水の区域が複数の消防署にわたるときは、提出先が消防長になる。
- 18区に1署ずつで、区と消防署が1対1に対応する。
