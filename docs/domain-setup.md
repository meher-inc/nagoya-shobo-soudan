# nagoya.todokede.jp の接続と公開設定（2026-10-20）

京都版（kyoto-shobo-soudan）の `docs/domain-setup.md` と同じ構成。SaaS ゾーンは共通基盤の meher-edge.com。

## Cloudflare

| 項目 | 値 |
|---|---|
| Worker | nagoya-shobo-soudan（Workers Builds で meher-inc/nagoya-shobo-soudan の main を自動デプロイ。デプロイコマンド `pnpm run deploy`、プレビュービルドは無効） |
| D1 | nagoya-shobo-soudan（`scripts/ensure-d1.mjs` が初回デプロイで作成） |
| カスタムホスト名 | nagoya.todokede.jp（meher-edge.com、最小 TLS 1.2、TXT 検証。2026-10-20 Active、証明書の期限 2027-01-18、DCV 委任で自動更新） |
| ルート | `nagoya.todokede.jp/*`（zone: meher-edge.com） |
| 正規URL | `CANONICAL_ORIGIN = https://nagoya.todokede.jp`（workers.dev は 301） |

## todokede.jp の DNS（お名前メールのコントロールパネル、2026-10-20 登録）

| 種別 | ホスト名 | 値 | 常設 |
|---|---|---|---|
| CNAME | `nagoya` | `customers.meher-edge.com` | 常設 |
| TXT | `_cf-custom-hostname.nagoya` | `48086508-4593-4355-9c20-64f799ba6af7` | Active 後は削除してよい |
| CNAME | `_acme-challenge.nagoya` | `nagoya.todokede.jp.d279b60fe8f38a0e.dcv.cloudflare.com` | 常設 |

XServer ドメインへ移管するときは `nagoya` と `_acme-challenge.nagoya` の CNAME も移す。

## 共通の鍵（全サービス共通、2026-10-20 作成）

Cloudflare Secrets Store（store `b0f7d791ae1c4110ada373a543bb668c`）に次の3つを登録済み。新しいサービスは `wrangler.jsonc` の `secrets_store_secrets` を写すだけで使える。

| 名前 | 中身 |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud（shun_maruoka@meher-inc.co.jp、プロジェクト mercurial-craft-512207-r1）の OAuth クライアント「AI相談サービス共通（Cloudflare Workers）」 |
| `STRIPE_SECRET_KEY` | Stripe（MeHer株式会社）の制限付きキー「MeHer AI相談サービス共通（Cloudflare Workers）」。権限は Checkout Sessions・Customer Portal・Prices・Products・Webhook Endpoints の書き込みだけ |

- Stripe の Price と Webhook はサービスが自分で作る（`src/worker/stripe-setup.ts`）。
- 新しいサービス・都市を足すときは、Google の OAuth クライアントの「承認済みのリダイレクト URI」に `https://<host>/auth/callback` を追加する（登録済み: nagoya.todokede.jp、nagoya の workers.dev、tokyo.todokede.jp）。
