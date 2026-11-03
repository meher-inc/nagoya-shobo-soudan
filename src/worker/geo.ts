// 生成AI・検索エンジン向けの入口（GEO・SEO）。
// - /llms.txt: サイトの説明と、よくある相談の結論を1行ずつ（ルール判定の結果だけ。AI の生成は通さない）
// - IndexNow: 検索エンジン（Bing など。ChatGPT 検索や Copilot は Bing の索引を使う）に URL の更新を知らせる
//   鍵は公開してよい値（鍵ファイルを各サイトの /<鍵>.txt に置くことで、そのサイトの持ち主だと示す仕組み）
import { SERVICE } from "../config/service.ts";
import { conclusion, judgeScenario, publishedScenarios } from "./guide-pages.ts";

export const INDEXNOW_KEY = "7d3f2a9c4b1e4f6a8c0d2e5b9a1f3c7e";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** 公開済みの都市版と全国版（入口 ai.todokede.jp は別リポジトリ）。週1回まとめて IndexNow に送る */
export const PUBLISHED_HOSTS = [
  "kyoto.todokede.jp",
  "tokyo.todokede.jp",
  "nagoya.todokede.jp",
  "sapporo.todokede.jp",
  "osaka.todokede.jp",
  "fukuoka.todokede.jp",
  "zenkoku.todokede.jp",
] as const;

export function llmsTxt(origin: string): string {
  const area: string = SERVICE.area;
  const lines = [
    `# ${SERVICE.name}`,
    "",
    `> ${SERVICE.description}`,
    "",
    `${area}の事業所（防火対象物の関係者）が、消防の届出・防火管理・消防用設備等・危険物について無料で相談できるAIです。届出の要否と設置義務は、消防法・消防法施行令・施行規則と${area === "全国" ? "条文を確認済みの火災予防条例" : `${area}の火災予防条例`}の条文どおりのルールで判定し、AI はその結果を説明します。書類の作成・提出は行政書士の業務のため、希望者には同意を得て専門家へ引き継ぎます。`,
    "",
    `運営: ${SERVICE.seller.name}（${SERVICE.seller.address}）。${area === "全国" ? "国・市町村" : area}・消防本部の公式サービスではありません。最終的な判断は所轄の消防署が行います。`,
    "",
    "## 主なページ",
    `- [相談する](${origin}/): 質問を入力すると、必要な届出・期限・提出先・根拠条文を回答します`,
    `- [よくある相談](${origin}/soudan): よくある条件をルール判定に当てはめた結果の一覧`,
    `- [利用規約](${origin}/legal/terms)`,
    `- [プライバシーポリシー](${origin}/legal/privacy)`,
    "",
    "## よくある相談の結論",
  ];
  for (const s of publishedScenarios()) {
    const r = judgeScenario(s);
    if (!r) continue;
    lines.push(`- [${s.title}](${origin}/soudan/${s.slug}): 条件「${s.lead}」。${conclusion(r)}`);
  }
  lines.push("", "## ほかの地域", "- [地域の一覧（トドケデ AI）](https://ai.todokede.jp/)", "");
  return lines.join("\n");
}

/** sitemap.xml の <loc> を取り出す */
export function sitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean);
}

/** IndexNow に送る本文（1ホストにつき1回） */
export function indexNowBody(host: string, urls: string[]) {
  return { host, key: INDEXNOW_KEY, keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 10_000) };
}
