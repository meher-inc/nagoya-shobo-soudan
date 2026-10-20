/**
 * 横浜市消防局の各消防署（本署）。18区に1署ずつ。
 * 出典（2026-10-20 確認）: 横浜市「消防局の組織と業務」から各消防署の「総務・予防課」ページ
 *   https://www.city.yokohama.lg.jp/city-info/yokohamashi/org/shobo/soshiki-gyomu/index.html
 *   例: https://www.city.yokohama.lg.jp/city-info/yokohamashi/org/shobo/soshiki-gyomu/tsurumi-shobo/somu-yobou.html
 *   各ページの最終更新日は 2025-03-26〜2026-04-21（署ごとに違う）。
 * 電話番号は各署の総務・予防課の連絡先として載っている番号（本署の代表番号と同じ「〜-0119」）。
 * 住所は総務・予防課の所在地（区総合庁舎内の署は、庁舎名と階まで書かれている）。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.yokohama.lg.jp/city-info/yokohamashi/org/shobo/soshiki-gyomu/index.html";

export const STATIONS: readonly Station[] = [
  { name: "鶴見消防署", ward: "鶴見区", address: "横浜市鶴見区鶴見中央三丁目20番1号 鶴見区総合庁舎2階", tel: "045-503-0119" },
  { name: "神奈川消防署", ward: "神奈川区", address: "横浜市神奈川区広台太田町3番地8 神奈川区総合庁舎本館1階", tel: "045-316-0119" },
  { name: "西消防署", ward: "西区", address: "横浜市西区戸部本町50番11号", tel: "045-313-0119" },
  { name: "中消防署", ward: "中区", address: "横浜市中区山吹町2番地2", tel: "045-251-0119" },
  { name: "南消防署", ward: "南区", address: "横浜市南区浦舟町2丁目33番地 南区総合庁舎3階", tel: "045-253-0119" },
  { name: "港南消防署", ward: "港南区", address: "横浜市港南区港南四丁目2番10号 港南区総合庁舎2階", tel: "045-844-0119" },
  { name: "保土ケ谷消防署", ward: "保土ケ谷区", address: "横浜市保土ケ谷区神戸町140番地5", tel: "045-342-0119" },
  { name: "旭消防署", ward: "旭区", address: "横浜市旭区鶴ケ峰一丁目4番地12 旭区総合庁舎本館2階", tel: "045-951-0119" },
  { name: "磯子消防署", ward: "磯子区", address: "横浜市磯子区磯子二丁目1番3号", tel: "045-753-0119" },
  { name: "金沢消防署", ward: "金沢区", address: "横浜市金沢区泥亀二丁目9番1号 金沢区総合庁舎1階", tel: "045-781-0119" },
  { name: "港北消防署", ward: "港北区", address: "横浜市港北区大豆戸町26番地1 港北区総合庁舎2階", tel: "045-546-0119" },
  { name: "緑消防署", ward: "緑区", address: "横浜市緑区中山4丁目36番19号", tel: "045-932-0119" },
  { name: "青葉消防署", ward: "青葉区", address: "横浜市青葉区市ケ尾町33番地1", tel: "045-974-0119" },
  { name: "都筑消防署", ward: "都筑区", address: "横浜市都筑区茅ケ崎中央32番1号 都筑区総合庁舎2階", tel: "045-945-0119" },
  { name: "戸塚消防署", ward: "戸塚区", address: "横浜市戸塚区戸塚町4144番地", tel: "045-881-0119" },
  { name: "栄消防署", ward: "栄区", address: "横浜市栄区桂町301番地", tel: "045-892-0119" },
  { name: "泉消防署", ward: "泉区", address: "横浜市泉区和泉中央北五丁目1番1号 泉区総合庁舎2階・3階", tel: "045-801-0119" },
  { name: "瀬谷消防署", ward: "瀬谷区", address: "横浜市瀬谷区二ツ橋町190番地 瀬谷区総合庁舎1階", tel: "045-362-0119" },
];
