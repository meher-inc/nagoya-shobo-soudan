/**
 * 堺市消防局の各消防署（本署）。
 * 出典（2026-10-20 確認）
 * - 名前・住所・電話: 堺市「市の組織・問合せ > 消防局」の各消防署ページ（いずれも 2026-04-01 更新）
 *   https://www.city.sakai.lg.jp/shisei/gaiyo/annai/gyoseikiko/shobo/index.html
 * - 管轄区域: 堺市消防局「あなたの街の消防署」の各署の管轄区域ページ
 *   https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shokai/shobosho/index.html
 * 堺市消防局は高石市（平成20年10月1日から）と大阪狭山市（令和3年4月1日から）の消防事務を受託しているため、
 * 市外の高石消防署・大阪狭山消防署も載せる（cities/sakai/notes.md）。
 * 予防の届出は、東区は美原消防署、南区は中消防署で受け付けるものがある（令和5年4月1日から）。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.sakai.lg.jp/shisei/gaiyo/annai/gyoseikiko/shobo/index.html";
export const JURISDICTION_SOURCE = "https://www.city.sakai.lg.jp/kurashi/bosai/shobo/shokai/shobosho/index.html";

export const STATIONS: readonly Station[] = [
  { name: "堺消防署", ward: "堺区", address: "堺市堺区出島浜通1番1号", tel: "072-244-0119" },
  { name: "中消防署", ward: "中区（南区の消防設備・危険物規制関係の届出の一部も受付）", address: "堺市中区深井沢町6番地6", tel: "072-277-0119" },
  { name: "東消防署", ward: "東区", address: "堺市東区日置荘原寺町138番地5", tel: "072-286-0119" },
  { name: "西消防署", ward: "西区（八田寺町40-1から3を含む）", address: "堺市西区鶴田町29番18号", tel: "072-274-0119" },
  { name: "南消防署", ward: "南区", address: "堺市南区原山台1丁14番1号", tel: "072-299-0119" },
  { name: "北消防署", ward: "北区", address: "堺市北区新金岡町4丁1番2号", tel: "072-250-0119" },
  { name: "美原消防署", ward: "美原区（東区の消防設備・危険物規制関係の届出の一部も受付）", address: "堺市美原区黒山6番地1", tel: "072-362-0119" },
  { name: "高石消防署", ward: "高石市（市外。堺市が消防事務を受託）", address: "高石市西取石1丁目27番23号", tel: "072-266-0119" },
  { name: "大阪狭山消防署", ward: "大阪狭山市（市外。堺市が消防事務を受託）", address: "大阪狭山市狭山1丁目2384番地の1", tel: "072-366-0055" },
];
