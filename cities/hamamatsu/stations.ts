/**
 * 浜松市消防局の各消防署（本署）。
 * 出典（2026-10-20 確認）
 * - 名前・住所・電話: 浜松市「消防局」組織案内（2026-07-06 更新）
 *   https://www.city.hamamatsu.shizuoka.jp/koho2/sosiki/other-office001.html
 * - 管轄: 浜松市消防局「消防署の町別管轄」（2025-03-31 更新）と町名50音順の各ページ（2026-03-31 更新）、
 *   消防署の町別管轄表（PDF）https://www.city.hamamatsu.shizuoka.jp/documents/5837/kankatsuhyou.pdf
 *   https://www.city.hamamatsu.shizuoka.jp/hfdsoum/disaster/shobo/kankatsu/index.html
 * 2024年1月の区の再編後も消防署は7署のまま（署名は旧区名）。中央区は4署、浜名区は2署で分けて管轄するため、
 * ward には区と地区名を書く（町名単位の管轄は上の町別管轄ページで確認する）。
 * 予防課の直通番号は各署のページに載っていないため、本署の代表番号を案内する。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.hamamatsu.shizuoka.jp/koho2/sosiki/other-office001.html";
export const JURISDICTION_SOURCE = "https://www.city.hamamatsu.shizuoka.jp/hfdsoum/disaster/shobo/kankatsu/index.html";

export const STATIONS: readonly Station[] = [
  { name: "中消防署", ward: "中央区の一部（中央・アクト・江東・県居・西・佐鳴台・城北・富塚・北・曳馬・萩丘・三方原地区）", address: "浜松市中央区下池川町19番1号", tel: "053-475-7561" },
  { name: "東消防署", ward: "中央区の一部（積志・笠井・長上・中ノ町・蒲・和田地区）", address: "浜松市中央区篠ケ瀬町1374番地", tel: "053-460-0119" },
  { name: "西消防署", ward: "中央区の一部（入野・神久呂・和地・伊佐見・庄内・雄踏・篠原・舞阪地区）", address: "浜松市中央区馬郡町4074番地の1", tel: "053-592-0134" },
  { name: "南消防署", ward: "中央区の一部（駅南・江西・可美・新津・白脇・飯田・芳川・河輪・五島地区）", address: "浜松市中央区森田町98番地", tel: "053-442-0119" },
  { name: "北消防署", ward: "浜名区の一部（都田・新都田・細江・引佐・三ヶ日地区）", address: "浜松市浜名区細江町三和2173番地の7", tel: "053-527-0119" },
  { name: "浜北消防署", ward: "浜名区の一部（浜名・北浜・中瀬・赤佐・麁玉地区）", address: "浜松市浜名区西美薗58番地", tel: "053-586-0119" },
  { name: "天竜消防署", ward: "天竜区", address: "浜松市天竜区二俣町二俣481番地", tel: "053-922-0119" },
];
