/**
 * 川崎市消防局の各消防署（本署）。
 * 出典（2026-10-20 確認）
 * - 名前・住所・電話: 川崎市「消防局・消防署の所在地・連絡先及び各消防署管轄区域」（2023-05-30 更新）
 *   https://www.city.kawasaki.jp/bousai/category/291-1-0-0-0-0-0-0-0-0.html
 * - 管轄: 川崎市消防局「管轄消防署一覧」（PDF、令和5年3月現在）
 *   https://www.city.kawasaki.jp/840/cmsfiles/contents/0000027/27413/kankatu.pdf
 * 川崎区は臨港消防署と川崎消防署の2署で分けて管轄する（臨港消防署の町名は管轄消防署一覧PDFのとおり）。
 * 他の6区は区ごとに1署。届出の窓口は各消防署の予防課（消防訓練実施計画報告書は警防課）。
 * 予防課の直通番号は各手続のページに載っていないため、本署の代表番号を案内する。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.kawasaki.jp/bousai/category/291-1-0-0-0-0-0-0-0-0.html";
export const JURISDICTION_SOURCE = "https://www.city.kawasaki.jp/840/cmsfiles/contents/0000027/27413/kankatu.pdf";

export const STATIONS: readonly Station[] = [
  { name: "臨港消防署", ward: "川崎区の一部（扇町・浮島町・東扇島・大師町・殿町・桜本・浜町・塩浜などの町名。全町名は管轄消防署一覧で確認）", address: "川崎市川崎区池上新町3丁目1番5号", tel: "044-299-0119" },
  { name: "川崎消防署", ward: "川崎区（臨港消防署の管轄区域を除く）", address: "川崎市川崎区南町20番地7", tel: "044-223-0119" },
  { name: "幸消防署", ward: "幸区", address: "川崎市幸区戸手2丁目12番1号", tel: "044-511-0119" },
  { name: "中原消防署", ward: "中原区", address: "川崎市中原区新丸子東3-1175-1", tel: "044-411-0119" },
  { name: "高津消防署", ward: "高津区", address: "川崎市高津区二子5-14-5", tel: "044-811-0119" },
  { name: "宮前消防署", ward: "宮前区", address: "川崎市宮前区宮前平2-20-4", tel: "044-852-0119" },
  { name: "多摩消防署", ward: "多摩区", address: "川崎市多摩区枡形2丁目6番1号", tel: "044-933-0119" },
  { name: "麻生消防署", ward: "麻生区", address: "川崎市麻生区万福寺1丁目5番4号", tel: "044-951-0119" },
];
