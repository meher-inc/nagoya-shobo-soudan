/**
 * 広島市消防局の各消防署（本署）。
 * 出典（2026-10-20 確認）
 * - 名前・位置・管轄区域: 広島市消防本部及び消防署の設置等に関する条例 別表（平成23年7月16日施行版）
 *   https://www.city.hiroshima.lg.jp/kikaku/houki/reiki_int/reiki_honbun/r500RG00000752.html
 * - 電話番号: 広島市消防局「広島市消防局の管轄区域、所在地及び連絡先」（2026-10-08 更新）
 *   https://www.city.hiroshima.lg.jp/living/shobo-bohan/1006085/1025613/1013783.html
 * 広島市消防局は平成19年4月1日から、安芸郡海田町・坂町・熊野町、山県郡安芸太田町、廿日市市吉和地区の消防事務を受託している。
 * 市外の区域は安佐北消防署（安芸太田町・廿日市市吉和）と安芸消防署（海田町・坂町・熊野町）が管轄し、
 * 南消防署は広島市・海田町・坂町の海上区域も管轄する（cities/hiroshima/notes.md）。
 * 東消防署は予防課の番号 082-263-8402 も公開している。ほかの署は代表番号。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.hiroshima.lg.jp/living/shobo-bohan/1006085/1025613/1013783.html";
export const JURISDICTION_SOURCE = "https://www.city.hiroshima.lg.jp/kikaku/houki/reiki_int/reiki_honbun/r500RG00000752.html";

export const STATIONS: readonly Station[] = [
  { name: "中消防署", ward: "中区", address: "広島市中区大手町五丁目20番12号", tel: "082-541-2700" },
  { name: "東消防署", ward: "東区", address: "広島市東区光町二丁目12番6号", tel: "082-263-8401" },
  { name: "南消防署", ward: "南区と、広島市・海田町・坂町の海上区域", address: "広島市南区的場町二丁目5番14号", tel: "082-261-5181" },
  { name: "西消防署", ward: "西区", address: "広島市西区都町43番10号", tel: "082-232-0381" },
  { name: "安佐南消防署", ward: "安佐南区", address: "広島市安佐南区緑井一丁目10番3号", tel: "082-877-4101" },
  { name: "安佐北消防署", ward: "安佐北区と、市外の山県郡安芸太田町・廿日市市吉和（消防事務を受託）", address: "広島市安佐北区可部南四丁目26番13号", tel: "082-814-4795" },
  { name: "安芸消防署", ward: "安芸区と、市外の安芸郡海田町・坂町・熊野町（消防事務を受託）", address: "安芸郡海田町堀川町3番12号", tel: "082-822-4349" },
  { name: "佐伯消防署", ward: "佐伯区", address: "広島市佐伯区五日市中央七丁目25番18号", tel: "082-921-2235" },
];
