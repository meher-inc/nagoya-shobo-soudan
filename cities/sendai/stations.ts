/**
 * 仙台市消防局の各消防署（本署）。
 * 出典（2026-10-20 確認）
 * - 名前・住所・電話: 仙台市消防局「署所の配置」（2025-08-01 更新）
 *   https://www.city.sendai.jp/kikakukoho/kurashi/anzen/shobo/shobokyoku/haichi.html
 *   青葉消防署・宮城消防署は各施設ページ（2016-09-20 更新）とも照合した。
 *   https://www.city.sendai.jp/sesakukoho/kurashi/shisetsu/kokyo/shobo/shobo-aoba/1794.html
 *   https://www.city.sendai.jp/sesakukoho/kurashi/shisetsu/kokyo/shobo/shobo-aoba/1799.html
 * - 少量危険物の案内ページ（2025-02-13 更新）の各署の電話番号も同じだった。
 *   https://www.city.sendai.jp/yobo-shido/download/bunyabetsu/bosai/kikenbutsu/shoryo/index.html
 * 青葉区は青葉消防署と宮城消防署（青葉区落合）の2署で分けて管轄している。境界は公式ページの文章では確認できなかった
 * （「署所の配置」の地図は画像）。そのため ward は「青葉区の一部」とした（cities/sendai/notes.md）。
 * 電話番号は各署の代表。若林消防署だけは予防課直通（022-282-0116）も掲載されている。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.sendai.jp/kikakukoho/kurashi/anzen/shobo/shobokyoku/haichi.html";

export const STATIONS: readonly Station[] = [
  { name: "青葉消防署", ward: "青葉区の一部（宮城消防署の管轄を除く）", address: "仙台市青葉区堤通雨宮町2番15号", tel: "022-234-1121" },
  { name: "宮城野消防署", ward: "宮城野区", address: "仙台市宮城野区苦竹三丁目6番1号", tel: "022-284-9211" },
  { name: "若林消防署", ward: "若林区", address: "仙台市若林区遠見塚二丁目25番20号", tel: "022-282-0119" },
  { name: "太白消防署", ward: "太白区", address: "仙台市太白区山田北前町15番1号", tel: "022-244-1119" },
  { name: "泉消防署", ward: "泉区", address: "仙台市泉区将監四丁目4番1号", tel: "022-373-0119" },
  { name: "宮城消防署", ward: "青葉区の一部（境界は要確認）", address: "仙台市青葉区落合二丁目15番1号", tel: "022-392-8119" },
];
