/**
 * 公開済みの都市。公開した都市はここに1行足す（並びは北から）。
 * pref はカードに小さく出す所在地。region は Cloudflare の request.cf.regionCode（都道府県コード）で、最初に選んでおく都市の推定に使う。
 */
export type City = { slug: string; name: string; pref: string; region: string };

export const CITIES: readonly City[] = [
  { slug: "sapporo", name: "札幌市", pref: "北海道", region: "01" },
  { slug: "tokyo", name: "東京都", pref: "関東", region: "13" },
  { slug: "nagoya", name: "名古屋市", pref: "愛知県", region: "23" },
  { slug: "kyoto", name: "京都市", pref: "京都府", region: "26" },
  { slug: "osaka", name: "大阪市", pref: "大阪府", region: "27" },
  { slug: "fukuoka", name: "福岡市", pref: "福岡県", region: "40" },
];

export function cityUrl(slug: string): string {
  return `https://${slug}.todokede.jp/`;
}

/** 国が日本で、都道府県に公開済みの都市があればその slug。なければ空文字 */
export function guessCity(country: unknown, regionCode: unknown): string {
  if (country !== "JP" || typeof regionCode !== "string") return "";
  const code = regionCode.replace(/^JP-/, "").padStart(2, "0");
  return CITIES.find((c) => c.region === code)?.slug ?? "";
}
