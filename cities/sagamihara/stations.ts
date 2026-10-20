/**
 * 相模原市消防局の各消防署（本署）。
 * 出典（2026-10-20 確認）
 * - 相模原市「警防部」（組織と業務、2026-04-01 更新）各署の警備課・査察指導課の住所・電話番号と担当区域
 *   https://www.city.sagamihara.kanagawa.jp/shisei/1026709/1000105/1025074/1022940.html
 * - 相模原市「消防局の概要」（2026-05-28 更新）「1局、4消防署、15分署、1出張所及び1救急隊派出所」
 *   https://www.city.sagamihara.kanagawa.jp/kurashi/1026529/shobo/shobokyoku/1008845.html
 * 区は3つで消防署は4つ。緑区は北消防署（城山・大沢・橋本地区）と津久井消防署（津久井・相模湖・藤野地区）に分かれる
 * （査察指導課の担当区域の記載）。地区の境界の細部は公式ページの文章では確認していない（cities/sagamihara/notes.md）。
 * 電話番号は届出の窓口である査察指導課（津久井消防署は警備課。査察指導班は警備課の中にある）。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.sagamihara.kanagawa.jp/shisei/1026709/1000105/1025074/1022940.html";

export const STATIONS: readonly Station[] = [
  { name: "相模原消防署", ward: "中央区", address: "相模原市中央区中央2-2-15", tel: "042-751-9135" },
  { name: "南消防署", ward: "南区", address: "相模原市南区相模大野5-34-1", tel: "042-744-0126" },
  { name: "北消防署", ward: "緑区のうち城山地区・大沢地区・橋本地区", address: "相模原市緑区橋本4-16-6", tel: "042-774-9949" },
  { name: "津久井消防署", ward: "緑区のうち津久井地区・相模湖地区・藤野地区", address: "相模原市緑区寸沢嵐3455-1", tel: "042-685-0119" },
];
