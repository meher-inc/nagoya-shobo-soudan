// アイコンの PNG と OGP 画像（1200x630）を作り、public/ に保存する。都市を足したら実行してコミットする。
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { chromium } from "@playwright/test";

const svg = readFileSync("public/icon.svg", "utf8");
const png = (size, pad = 0) => {
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const s = 64 + pad * 2;
  const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${s} ${s}"><rect x="${-pad}" y="${-pad}" width="${s}" height="${s}" fill="#fff"/>${inner}</svg>`;
  return new Resvg(wrapped, { fitTo: { mode: "width", value: size } }).render().asPng();
};
writeFileSync("public/icon-192.png", png(192));
writeFileSync("public/icon-512.png", png(512));
writeFileSync("public/apple-touch-icon.png", png(180, 6));

const cities = [...readFileSync("src/cities.ts", "utf8").matchAll(/name: "([^"]+)"/g)].map((m) => m[1]);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;width:1200px;height:630px;font-family:"Noto Sans CJK JP","Hiragino Sans",sans-serif;background:#fff;overflow:hidden;position:relative;color:#15171c}
.a{position:absolute;border-radius:50%;filter:blur(70px);opacity:.6}
.card{position:absolute;inset:64px;border-radius:44px;background:linear-gradient(160deg,rgba(255,255,255,.78),rgba(255,255,255,.42));backdrop-filter:blur(22px) saturate(180%);border:2px solid rgba(255,255,255,.9);box-shadow:inset 0 2px 0 #fff,0 20px 70px rgba(30,36,60,.1);padding:64px 72px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:22px;font-size:68px;font-weight:800;letter-spacing:.02em}
.brand img{width:92px;height:92px}
.sub{font-size:40px;font-weight:700;color:#4a4f5a;margin-top:18px}
.cities{display:flex;flex-wrap:wrap;gap:14px}
.cities span{font-size:28px;font-weight:700;color:#c2410c;background:rgba(194,65,12,.08);border:2px solid rgba(194,65,12,.18);padding:8px 22px;border-radius:999px}
.host{position:absolute;right:72px;top:72px;font-size:26px;color:#8a909c;font-weight:600}
</style></head><body>
<div class="a" style="width:700px;height:700px;background:#fed7aa;left:-200px;top:-260px"></div>
<div class="a" style="width:700px;height:700px;background:#fde68a;right:-220px;bottom:-300px"></div>
<div class="a" style="width:420px;height:420px;background:#fecdd3;left:520px;top:220px;opacity:.4"></div>
<div class="card"><div class="host">ai.todokede.jp</div>
<div><div class="brand"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}">トドケデ AI</div>
<div class="sub">消防の届出・防火管理を、AIに無料で相談</div></div>
<div class="cities">${cities.map((c) => `<span>${c}</span>`).join("")}</div></div>
</body></html>`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: "public/og.png" });
await browser.close();
console.log("public/ に icon-192.png, icon-512.png, apple-touch-icon.png, og.png を作成");
