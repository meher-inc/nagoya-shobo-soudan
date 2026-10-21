# トドケデ AI 入口（ai.todokede.jp）

地域を選び、質問を各都市の消防相談（`https://<英字>.todokede.jp/?q=…`）へ渡す入口。開くと入力欄にフォーカスがあり、地域が分からないときだけ送信時に地域の一覧を出す。Cloudflare が判定した都道府県に公開済みの都市があれば、その都市を最初から選んでおく。選んだ地域は端末に覚える。

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
pnpm run deploy                               # Workers Builds では main への push で実行
```

## 技術選定の理由

| 技術 | 理由 |
|---|---|
| Cloudflare Workers + Static Assets | 各都市版と同じ基盤。HTML を返すときだけ Worker が動き、都道府県の推定（`request.cf.regionCode`）と都市一覧の埋め込みを行う |
| 素の HTML・CSS・JS（フレームワークなし） | 画面は入力欄と一覧だけで、Preact も不要。JS は約6KB で、読み込み前からスケルトンと本体が出る |
| 共通のデザイン基準（service-template の docs/DESIGN.md） | 白の Liquid Glass・スプリング・スケルトンを各都市版とそろえ、入口から都市版へ移っても同じ手触りにする |
| wrangler | 開発サーバーとデプロイ |
| @playwright/test | 実ブラウザでの確認（Pixel 7・iPhone 15・デスクトップ） |
| @resvg/resvg-js | アイコンの PNG をビルドなしで作る（`pnpm assets`） |
| typescript・@cloudflare/workers-types・@types/node | 型検査 |
