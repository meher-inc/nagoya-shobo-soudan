/**
 * 公開済みの都市。公開した都市はここに1行足す（並びは北から）。
 * pref はカードに小さく出す所在地。
 */
export type City = { slug: string; name: string; pref: string };

export const CITIES: readonly City[] = [
  { slug: "sapporo", name: "札幌市", pref: "北海道" },
  { slug: "tokyo", name: "東京都", pref: "関東" },
  { slug: "nagoya", name: "名古屋市", pref: "愛知県" },
  { slug: "kyoto", name: "京都市", pref: "京都府" },
  { slug: "osaka", name: "大阪市", pref: "大阪府" },
  { slug: "fukuoka", name: "福岡市", pref: "福岡県" },
];

export function cityUrl(slug: string): string {
  return `https://${slug}.todokede.jp/`;
}
