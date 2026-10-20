/**
 * 福岡市消防局の各消防署（本署）。区ごとに1署。
 * 出典（2026-10-20 確認）
 * - 住所・電話番号: 福岡市消防局「所在地・アクセス」（2026-07-15 更新）
 *   https://www.city.fukuoka.lg.jp/syobo/somu/about/syozaiti.html
 * - 管轄区域: 福岡市消防本部及び消防署設置条例 別表（昭和39年条例第79号、平成30年4月1日施行の版）
 *   https://www.city.fukuoka.lg.jp/d1w_reiki/reiki_honbun/q003RG00000946.html
 * 予防課の直通番号は所在地ページに載っていないため、署の代表番号を載せる。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.fukuoka.lg.jp/syobo/somu/about/syozaiti.html";

export const STATIONS: readonly Station[] = [
  { name: "東消防署", ward: "東区", address: "福岡市東区千早4丁目15番1号", tel: "092-683-0119" },
  { name: "博多消防署", ward: "博多区", address: "福岡市博多区博多駅前4丁目19番7号", tel: "092-475-0119" },
  { name: "中央消防署", ward: "中央区", address: "福岡市中央区那の津2丁目5番1号", tel: "092-762-0119" },
  { name: "南消防署", ward: "南区", address: "福岡市南区塩原2丁目6番11号", tel: "092-541-0219" },
  { name: "城南消防署", ward: "城南区", address: "福岡市城南区神松寺2丁目19番12号", tel: "092-863-8119" },
  { name: "早良消防署", ward: "早良区", address: "福岡市早良区百道浜1丁目3番1号", tel: "092-821-0245" },
  { name: "西消防署", ward: "西区", address: "福岡市西区今宿東1丁目7番12号", tel: "092-806-0642" },
];
