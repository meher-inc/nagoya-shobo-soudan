/**
 * 北九州市消防局の各消防署（本署）。区ごとに1署。
 * 出典（2026-10-20 確認）
 * - 名称・位置・管轄区域: 北九州市消防本部及び消防署の設置等に関する条例 別表（昭和43年条例第24号、令和2年2月22日施行の版）
 *   北九州市 Reiki-Base https://krq002.legal-square.com/HAS-Shohin/page/SJSrbLogin.jsf
 * - 電話番号・郵便番号: 北九州市「消防局」組織・電話番号のページ（2026-04-09 更新）
 *   https://www.city.kitakyushu.lg.jp/contents/924_01779.html
 * 各署の予防課の電話番号は、同ページで署の代表番号と同じ番号が載っている。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.kitakyushu.lg.jp/contents/924_01779.html";

export const STATIONS: readonly Station[] = [
  { name: "門司消防署", ward: "門司区", address: "北九州市門司区大里東一丁目4番10号", tel: "093-372-0119" },
  { name: "小倉北消防署", ward: "小倉北区", address: "北九州市小倉北区大手町8番38号", tel: "093-582-0119" },
  { name: "小倉南消防署", ward: "小倉南区", address: "北九州市小倉南区若園五丁目1番3号", tel: "093-951-0119" },
  { name: "若松消防署", ward: "若松区", address: "北九州市若松区桜町1番28号", tel: "093-752-0119" },
  { name: "八幡東消防署", ward: "八幡東区", address: "北九州市八幡東区大谷一丁目3番1号", tel: "093-663-0119" },
  { name: "八幡西消防署", ward: "八幡西区", address: "北九州市八幡西区相生町19番19号", tel: "093-622-0119" },
  { name: "戸畑消防署", ward: "戸畑区", address: "北九州市戸畑区新池二丁目1番15号", tel: "093-861-0119" },
];
