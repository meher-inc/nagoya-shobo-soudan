# トドケデ AI 入口（ai.todokede.jp）

地域を選んで各都市の消防相談（`https://<英字>.todokede.jp/`）へ進むだけの入口。相談の入力欄は置かない。公開済みの都市をカードで並べ（スマホ2列・PC3列）、端末に保存した前回の地域、または Cloudflare が判定した都道府県（`request.cf.regionCode`）から推定した都市を、一覧の上に「前回選んだ地域」「お近くの地域」として出す。選んだ地域は端末に覚える。

消防以外の分野に広げるときは、この入口を分野の選択に変える（URL もそのとき見直す）。

## 都市を足す

1. `src/cities.ts` に1行足す（slug・名前・都道府県コード）
2. `pnpm assets`（OGP 画像に都市名が入る）
3. `pnpm test`

## コマンド

```bash
pnpm install
pnpm run typecheck && pnpm run test:unit
CHROMIUM_PATH=<chromium> pnpm run test:e2e   # CI では Chromium と WebKit
URL=http://localhost:8787/ CHROMIUM_PATH=<chromium> node scripts/shots.mjs  # docs/screenshots を更新
pnpm run deploy                               # Workers Builds では main への push で実行
```

## 技術選定の理由

| 技術 | 理由 |
|---|---|
| Cloudflare Workers + Static Assets | 各都市版と同じ基盤。HTML を返すときだけ Worker が動き、都道府県の推定（`request.cf.regionCode`）と都市一覧の埋め込みを行う |
| 素の HTML・CSS・JS（フレームワークなし） | 画面は都市のリンク一覧だけで、Preact も不要。一覧は Worker が HTML に埋め込むので JS なしでも選べる（JS は前回・推定の地域の表示と保存だけ） |
| 共通のデザイン基準（service-template の docs/DESIGN.md） | 白の背景・ガラスの面・スプリングを各都市版とそろえ、入口から都市版へ移っても同じ手触りにする |
| wrangler | 開発サーバーとデプロイ |
| @playwright/test | 実ブラウザでの確認（Pixel 7・iPhone 15・デスクトップ） |
| @resvg/resvg-js | アイコンの PNG をビルドなしで作る（`pnpm assets`） |
| typescript・@cloudflare/workers-types・@types/node | 型検査 |
