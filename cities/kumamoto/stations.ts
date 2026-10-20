/**
 * 熊本市消防局の各消防署（本署）。6署。市外の上益城郡益城町・阿蘇郡西原村も管轄する（益城西原消防署）。
 * 出典（2026-10-20 確認）
 * - 名称・位置・管轄区域: 熊本市消防本部及び消防署の設置等に関する条例 別表（昭和39年条例第48号、令和3年12月17日施行の版）
 *   熊本市例規集 Reiki-Base https://krq402.legal-square.com/HAS-Shohin/page/SJSrbLogin.jsf
 * - 受付窓口の電話番号・管轄区域の案内: 熊本市消防局「防火対象物の使用開始の届出をしましょう」（2026-03-06 更新）
 *   https://www.city.kumamoto.jp/kiji00369693/index.html
 * - 代表番号との照合: 熊本市消防局「消防局の組織・連絡先」（2025-04-01 更新）
 *   https://www.city.kumamoto.jp/kiji0031561/index.html
 * tel は各署の指導課（届出の受付窓口）の番号。代表番号は中央 096-371-0119、東 096-367-0119、西 096-325-0119、
 * 南 096-212-0119、北 096-327-0119、益城西原 096-286-2119。
 * 中央区は中央消防署と西消防署で分かれる。条例の別表は町名で、消防局の案内ページは校区で書いている。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.kumamoto.jp/kiji00369693/index.html";

export const STATIONS: readonly Station[] = [
  { name: "中央消防署", ward: "中央区（一新・慶徳・五福・向山校区を除く）", address: "熊本市中央区大江3丁目1番3号", tel: "096-364-2894" },
  { name: "東消防署", ward: "東区", address: "熊本市東区東町4丁目6番17号", tel: "096-367-6315" },
  { name: "西消防署", ward: "西区、中央区（一新・慶徳・五福・向山校区）", address: "熊本市中央区米屋町1丁目12番地1", tel: "096-353-5028" },
  { name: "南消防署", ward: "南区", address: "熊本市南区平田2丁目13番1号", tel: "096-212-0303" },
  { name: "北消防署", ward: "北区", address: "熊本市北区四方寄町514番地1", tel: "096-327-2020" },
  { name: "益城西原消防署", ward: "上益城郡益城町、阿蘇郡西原村（熊本市外。常備消防事務を受託）", address: "上益城郡益城町大字寺迫202番地1", tel: "096-286-2298" },
];
