import { LegalBack } from "./App";
import { SERVICE } from "../config/service";

const SELLER = SERVICE.seller;
const TRIAL = `初回の相談送信から${SERVICE.trialHours}時間`;
// 利用規約とプライバシーポリシーは services.todokede.jp（todokede-corporate）に置き、/legal/terms・/legal/privacy はそこへ転送する（src/worker/index.ts）

function Tokushoho() {
  const rows: [string, string][] = [
    ["販売事業者", SELLER.name],
    ["運営統括責任者", SELLER.representative],
    ["所在地", SELLER.address],
    ["電話番号", "お取引に関しご請求があれば遅滞なく開示いたします。まずはメールにてお問い合わせください。"],
    ["お問い合わせ", SELLER.email],
    ["販売価格", `${SERVICE.price.label}。${TRIAL}は無料です。`],
    ["商品代金以外の必要料金", "インターネット接続に係る通信料"],
    ["支払方法", "クレジットカード決済（Stripe）"],
    ["支払時期", "有料プランの登録時に初回分を決済し、以後は毎月の更新日に自動で決済されます。"],
    ["提供時期", "決済完了後、直ちに利用できます。"],
    ["解約・返金", "いつでも解約できます。解約後も現在の請求期間の終了まで利用でき、日割りでの返金は行いません。"],
    ["動作環境", "最新版のSafari、Chrome、Edge、Firefox"],
  ];
  return (
    <>
      <h1>特定商取引法に基づく表記</h1>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export function Legal({ page }: { page: string }) {
  const content = <Tokushoho />;
  return (
    <>
      <div class="ambient" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <main class="legal">
        <LegalBack />
        <article class="card glass">{content}</article>
      </main>
    </>
  );
}
