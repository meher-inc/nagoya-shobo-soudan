/**
 * 岡山市消防局の各消防署（本署）。
 * 出典（2026-10-20 確認）
 * - 名前・住所・電話: 岡山市「防火対象物使用開始（変更）届出書 様式第3号」の申請・届出書提出先（2026-04-01 更新）
 *   https://www.city.okayama.jp/shisei/0000010355.html
 * - 管轄（中学校区）: 岡山市「『消防設備』『防火管理』『防火対象物』『査察指導』に関する問い合わせはこちら」（2023-06-05 掲載）
 *   https://www.city.okayama.jp/kurashi/0000050441.html
 * - 吉備中央町: 岡山市「西消防署の出張所」（2024-10-09 掲載）に「岡山市消防局が事務委託を受諾し」とあり、
 *   吉備中央出張所の管轄は「加賀郡吉備中央町全域」。 https://www.city.okayama.jp/shisei/0000004388.html
 * 北消防署と西消防署は北区を中学校区で分けて管轄する。西消防署は市外の加賀郡吉備中央町も管轄する（cities/okayama/notes.md）。
 * 電話番号は各消防署の予防係の窓口として案内されている番号（代表と同じ）。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.okayama.jp/shisei/0000010355.html";
export const JURISDICTION_SOURCE = "https://www.city.okayama.jp/kurashi/0000050441.html";

export const STATIONS: readonly Station[] = [
  { name: "北消防署", ward: "北区のうち中央・桑田・岡北・香和・御津・建部の各中学校区と、御南中学校区の笹ケ瀬川以東", address: "岡山市北区鹿田町二丁目4-1", tel: "086-226-1119" },
  { name: "西消防署", ward: "北区のうち京山・石井・高松・足守の各中学校区と、御南中学校区の笹ケ瀬川以西。市外の加賀郡吉備中央町（消防事務を受託）", address: "岡山市北区野殿西町427-1", tel: "086-256-1119" },
  { name: "中消防署", ward: "中区", address: "岡山市中区今在家地先", tel: "086-275-1119" },
  { name: "東消防署", ward: "東区", address: "岡山市東区西大寺南一丁目2-4", tel: "086-942-9119" },
  { name: "南消防署", ward: "南区", address: "岡山市南区浦安南町495-88", tel: "086-262-0119" },
];
