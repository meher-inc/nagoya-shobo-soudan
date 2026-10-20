/**
 * 千葉市消防局の各消防署（本署）。
 * 出典（2026-10-20 確認）
 * - 千葉市 施設情報「千葉市 中央消防署」ほか各署のページ（住所・電話番号）
 *   https://www.city.chiba.jp/shisetsu/shobo/0002.html（中央）、0007.html（花見川）、0011.html（稲毛）、
 *   0013.html（若葉）、0019.html（緑）、0023.html（美浜）
 * - 各消防署のトップページの「このページの情報発信元」とも照合した（https://www.city.chiba.jp/shobo/chuo/index.html など）。
 * 6区に1署ずつ。電話番号は各署の代表。予防課の直通は「火災予防関係手続の電子申請」（2026-06-03 更新）に載っている
 * （https://www.city.chiba.jp/shobo/yobo/yobo/kunren_densisinsei.html）ので prompt.ts に書いた。
 * 中央消防署は消防局庁舎（セーフティーちば）の中にある。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.chiba.jp/shobo/somu/somu/disposition.html";

export const STATIONS: readonly Station[] = [
  { name: "中央消防署", ward: "中央区", address: "千葉市中央区長洲1丁目2番1号 セーフティーちば2階", tel: "043-202-1615" },
  { name: "花見川消防署", ward: "花見川区", address: "千葉市花見川区犢橋町107番地2", tel: "043-259-2544" },
  { name: "稲毛消防署", ward: "稲毛区", address: "千葉市稲毛区穴川4丁目12番2号", tel: "043-284-5111" },
  { name: "若葉消防署", ward: "若葉区", address: "千葉市若葉区金親町244-1", tel: "043-237-7998" },
  { name: "緑消防署", ward: "緑区", address: "千葉市緑区おゆみ野3丁目15番地1号", tel: "043-292-6111" },
  { name: "美浜消防署", ward: "美浜区", address: "千葉市美浜区真砂5丁目15番6号", tel: "043-279-0119" },
];
