/**
 * 神戸市消防局の各消防署（本署）と、届出の窓口を持つ北神分署。
 * 出典（2026-10-20 確認）
 * - 住所・電話・管轄・査察係のメールアドレス: 神戸市消防局「火災予防の手続きやご相談」（2026-09-04 更新）
 *   https://www.city.kobe.lg.jp/a92906/bosai/shobo/sasatsu/sasatsu-kankatsu.html
 * - 名前・住所・代表電話の照合: 「消防局・消防署などの一覧」（2026-08-31 更新）
 *   https://www.city.kobe.lg.jp/a21572/bosai/shobo/outline/organization/syosyo.html
 * - 北神分署の管轄（北区の21町）: https://www.city.kobe.lg.jp/documents/3198/hokushinkankatsu.pdf
 * - 水上消防署の管轄（中央区の港湾部・ポートアイランド・神戸空港）: https://www.city.kobe.lg.jp/documents/3198/suijoukankatsu.pdf
 * 建物の届出・相談の窓口は各消防署の査察係。消防同意など新築・増築の消防用設備等の手続は本部の査察課設備指導係（prompt.ts）。
 * 神戸市消防局が市外の消防事務を受託している旨の記載は、確認したページにはなかった（cities/kobe/notes.md）。
 */
export type Station = { name: string; ward: string; address: string; tel: string };

export const STATIONS_SOURCE = "https://www.city.kobe.lg.jp/a92906/bosai/shobo/sasatsu/sasatsu-kankatsu.html";

export const STATIONS: readonly Station[] = [
  { name: "東灘消防署", ward: "東灘区", address: "神戸市東灘区住吉東町5丁目2番1号", tel: "078-843-0119" },
  { name: "灘消防署", ward: "灘区", address: "神戸市灘区神ノ木通3丁目6番18号", tel: "078-882-0119" },
  { name: "中央消防署", ward: "中央区（水上消防署の管轄を除く）", address: "神戸市中央区小野柄通2丁目1番19号", tel: "078-241-0119" },
  { name: "兵庫消防署", ward: "兵庫区", address: "神戸市兵庫区荒田町1丁目21番1号", tel: "078-512-0119" },
  { name: "北消防署", ward: "北区（北神分署の管轄を除く）", address: "神戸市北区北五葉2丁目1番9号", tel: "078-591-0119" },
  { name: "北消防署 北神分署", ward: "北区のうち有野町・有馬町・道場町・八多町・長尾町・藤原台など21町（北神管轄）", address: "神戸市北区藤原台北町7丁目20番1号", tel: "078-981-0119" },
  { name: "長田消防署", ward: "長田区", address: "神戸市長田区北町3丁目4番8号", tel: "078-578-0119" },
  { name: "須磨消防署", ward: "須磨区", address: "神戸市須磨区中島町1丁目1番1号", tel: "078-735-0119" },
  { name: "垂水消防署", ward: "垂水区", address: "神戸市垂水区舞多聞東1丁目10番30号", tel: "078-786-0119" },
  { name: "西消防署", ward: "西区", address: "神戸市西区春日台5丁目1番10号", tel: "078-961-0119" },
  { name: "水上消防署", ward: "中央区の小野浜町・新港町・波止場町・港島・港島中町・港島南町・神戸空港", address: "神戸市中央区港島3丁目2番2号", tel: "078-302-0119" },
];
