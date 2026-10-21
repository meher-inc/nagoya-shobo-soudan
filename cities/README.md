# 政令指定都市版の値

全政令指定都市版トドケデ AI（https://<英字>.todokede.jp）を、この名古屋市版から作るための都市ごとの値。2026-10-20 に各市の例規集と消防局の公式ページで確認して作成。

- `<英字>/service.ts`・`stations.ts`・`prompt.ts`: 生成時に `src/config/` へ入る
- `<英字>/notes.md`: 使った一次情報（URL・確認日）と確認できなかった項目。生成時に `docs/city-notes.md` になる
- 届出の判定は `src/rules/cities/<英字>.ts`（横浜・大阪は `src/rules/filings.ts`）

生成: `python3 scripts/gen-city.py <出力先> <英字> [<英字> ...]`（英字を省くと18都市すべて）。名前・Worker 名・D1・レート制限 namespace・公開URL・runRules の地域を差し替える。

公開の順番（2026-10-21 決定）: 京都・東京・名古屋・札幌・大阪・福岡で公開から60日の無料相談が月300件に届いたら、残り15都市のリポジトリを作って公開する（大阪・福岡は2026-10-21に丸岡さんの指示で先行公開）。

## 一般版（全国）
`zenkoku/` は都市版がない地域の相談を受ける一般版（https://zenkoku.todokede.jp）。生成は `python3 scripts/gen-city.py <出力先> zenkoku`（英字を省いたときの全都市生成には含めない）。判定の地域は `general` で、設備は国の政令、火災予防条例の届出は確認済みの21管轄の集計で答える。根拠と未確認の項目は `zenkoku/notes.md`。相談件数は政令市版の判定（月300件）とは分けて数える。
