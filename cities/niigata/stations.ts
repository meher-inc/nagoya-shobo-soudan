/**
 * 新潟市消防局の各消防署（本署）。
 * 出典: 新潟市消防局「組織と業務内容」の消防施設一覧（2024-04-01 更新、2026-10-20 確認）
 * https://www.city.niigata.lg.jp/kurashi/bohan/shobo/syokai/soshikizu.html
 * 各署の紹介ページとも照合した（北 2021-04-01、中央 2024-04-01、江南 2024-06-15、秋葉 2024-04-01、南 2026-04-01、西 2012-06-01、西蒲 2022-03-17 更新。東は署トップページ）。
 * 新潟市は8区8署で、各署の紹介ページはそれぞれの区を管轄すると書いている。
 * 予防の届出は、条例上は消防長あてで、届出書は所轄消防署長に出す（届出等の事務取扱いに関する規程）。
 * 電話番号は各署の代表。秋葉消防署は予防課総務係の問い合わせ先として同じ番号を掲載している。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.niigata.lg.jp/kurashi/bohan/shobo/syokai/soshikizu.html";

export const STATIONS: readonly Station[] = [
  { name: "北消防署", ward: "北区", address: "新潟市北区葛塚5095番地", tel: "025-387-0119" },
  { name: "東消防署", ward: "東区", address: "新潟市東区山木戸1丁目1番20号", tel: "025-275-9111" },
  { name: "中央消防署", ward: "中央区", address: "新潟市中央区鐘木257番地1", tel: "025-288-3119" },
  { name: "江南消防署", ward: "江南区", address: "新潟市江南区泉町3丁目2番1号", tel: "025-381-2327" },
  { name: "秋葉消防署", ward: "秋葉区", address: "新潟市秋葉区程島1958番地1", tel: "0250-22-0175" },
  { name: "南消防署", ward: "南区", address: "新潟市南区親和町8番1号", tel: "025-372-0119" },
  { name: "西消防署", ward: "西区", address: "新潟市西区槇尾80番地1", tel: "025-262-2119" },
  { name: "西蒲消防署", ward: "西蒲区", address: "新潟市西蒲区前田414番地1", tel: "0256-72-3309" },
];
