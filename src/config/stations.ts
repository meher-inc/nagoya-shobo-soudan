/**
 * 名古屋市消防局の各消防署（本署）。
 * 出典: 名古屋市消防局「名古屋市の各消防署」（2026-06-24 更新、2026-10-20 確認）
 * https://www.city.nagoya.jp/bousai/shoubou/1012732/1012733/1012735.html
 * 各署の紹介ページとも照合済み。予防課の直通番号は公式サイトに載っていないため、代表番号を案内する。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.nagoya.jp/bousai/shoubou/1012732/1012733/1012735.html";

export const STATIONS: readonly Station[] = [
  { name: "千種消防署", ward: "千種区", address: "名古屋市千種区希望ケ丘二丁目6番21号", tel: "052-764-0119" },
  { name: "東消防署", ward: "東区", address: "名古屋市東区筒井一丁目8番30号", tel: "052-935-0119" },
  { name: "北消防署", ward: "北区", address: "名古屋市北区萩野通2丁目1番地", tel: "052-981-0119" },
  { name: "西消防署", ward: "西区", address: "名古屋市西区児玉二丁目25番22号", tel: "052-521-0119" },
  { name: "中村消防署", ward: "中村区", address: "名古屋市中村区大宮町1丁目53番地", tel: "052-481-0119" },
  { name: "中消防署", ward: "中区", address: "名古屋市中区栄一丁目23番13号 伏見ライフプラザ内", tel: "052-231-0119" },
  { name: "昭和消防署", ward: "昭和区", address: "名古屋市昭和区御器所通2丁目16番地の1", tel: "052-841-0119" },
  { name: "瑞穂消防署", ward: "瑞穂区", address: "名古屋市瑞穂区北原町3丁目17番地", tel: "052-852-0119" },
  { name: "熱田消防署", ward: "熱田区", address: "名古屋市熱田区高蔵町4番9号", tel: "052-671-0119" },
  { name: "中川消防署", ward: "中川区", address: "名古屋市中川区高畑一丁目224番地", tel: "052-363-0119" },
  { name: "港消防署", ward: "港区", address: "名古屋市港区千鳥一丁目11番19号", tel: "052-661-0119" },
  { name: "南消防署", ward: "南区", address: "名古屋市南区桜本町24番地", tel: "052-825-0119" },
  { name: "守山消防署", ward: "守山区", address: "名古屋市守山区西新11番8号", tel: "052-791-0119" },
  { name: "緑消防署", ward: "緑区", address: "名古屋市緑区滝ノ水四丁目2007番地", tel: "052-896-0119" },
  { name: "名東消防署", ward: "名東区", address: "名古屋市名東区野間町40番地", tel: "052-703-0119" },
  { name: "天白消防署", ward: "天白区", address: "名古屋市天白区原五丁目2506番地", tel: "052-801-0119" },
];
