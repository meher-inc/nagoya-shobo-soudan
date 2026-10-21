// 入口のスクリーンショット。URL=<入口の URL> CHROMIUM_PATH=<chromium> node scripts/shots.mjs [出力先ディレクトリ]
import { chromium, devices } from "@playwright/test";
const out = process.argv[2] || "docs/screenshots";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });

const mobile = await b.newContext({ ...devices["Pixel 7"], viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 });
const p = await mobile.newPage();
await p.goto(process.env.URL);
await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/1-home.png` });
await p.evaluate(() => localStorage.setItem("todokede-ai:city", "nagoya"));
await p.reload();
await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/portal-mobile.png` });

const desktop = await b.newContext({ ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } });
const d = await desktop.newPage();
await d.goto(process.env.URL);
await d.evaluate(() => localStorage.setItem("todokede-ai:city", "kyoto"));
await d.reload();
await d.waitForTimeout(900);
await d.screenshot({ path: `${out}/portal-desktop.png` });
await b.close();
