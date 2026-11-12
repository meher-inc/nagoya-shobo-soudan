// 一時的な計測（plan 20261112-webkit-e2e-stability）。どの層が WebKit の1フレームを重くしているかを測る。マージ前に消す
import { expect, test, type Page } from "@playwright/test";

const NB = "backdrop-filter:none!important;-webkit-backdrop-filter:none!important";
const variants: [string, string][] = [
  ["base", ""],
  ["noScrimBlur", `.scrim{${NB}}`],
  ["noSheetBlur", `.sheet{${NB}}`],
  ["noUnderGlass", `.glass:not(.sheet){${NB}}`],
  ["noAmbientFilter", ".ambient i{filter:none!important}"],
  ["noAmbient", ".ambient{display:none!important}"],
  ["noGlassBefore", ".glass::before,.glass::after{display:none!important}"],
  ["allBackdropNone", `.glass,.scrim{${NB}}`],
];

async function frames(page: Page, n = 4): Promise<number[]> {
  return page.evaluate(
    (n) =>
      new Promise<number[]>((res) => {
        const t: number[] = [];
        const f = () => {
          t.push(performance.now());
          if (t.length <= n) requestAnimationFrame(f);
          else res(t.slice(1).map((x, i) => Math.round(x - t[i])));
        };
        requestAnimationFrame(f);
      }),
    n,
  );
}

async function measure(page: Page, label: string) {
  for (const [name, css] of variants) {
    await page.evaluate((css) => {
      document.getElementById("diagv")?.remove();
      const s = document.createElement("style");
      s.id = "diagv";
      s.textContent = css;
      document.head.appendChild(s);
    }, css);
    await frames(page, 2); // 切り替え直後の1枚は捨てる
    const f = await frames(page, 4);
    console.log(`[perf] ${label} ${name} frames=${f.join(",")} median=${[...f].sort((a, b) => a - b)[2]}ms`);
  }
}

for (const motion of ["reduce", "no-preference"] as const) {
  test(`diag perf ${motion} @local`, async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-safari" && !process.env.DIAG_ANY, "WebKit only");
    test.setTimeout(600_000);
    await page.context().setExtraHTTPHeaders({ "x-test-ip": `198.51.100.${Math.floor(Math.random() * 250)}-${Date.now()}` });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/");
    await expect(page.getByTestId("composer-input")).toBeVisible();
    await measure(page, `${motion} home`);
    await page.getByTestId("composer-input").fill("防火対象物使用開始届を作成してほしいです");
    await page.getByTestId("send-button").click();
    await expect(page.getByTestId("msg-assistant").last().getByRole("button", { name: "コピー" })).toBeVisible({ timeout: 120_000 });
    await measure(page, `${motion} answer`);
    await page.getByTestId("menu-button").click();
    await expect(page.getByTestId("menu-sheet")).toBeVisible();
    await measure(page, `${motion} sheet`);
  });
}

test("diag perf dpr1 @local", async ({ browser, baseURL }) => {
  test.skip(test.info().project.name !== "mobile-safari" && !process.env.DIAG_ANY, "WebKit only");
  test.setTimeout(600_000);
  const ctx = await browser.newContext({ viewport: { width: 393, height: 659 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: "reduce", extraHTTPHeaders: { "x-test-ip": `198.51.100.7-${Date.now()}` } });
  const page = await ctx.newPage();
  await page.goto(`${baseURL}/`);
  await page.getByTestId("composer-input").fill("防火対象物使用開始届を作成してほしいです");
  await page.getByTestId("send-button").click();
  await expect(page.getByTestId("msg-assistant").last().getByRole("button", { name: "コピー" })).toBeVisible({ timeout: 120_000 });
  await page.getByTestId("menu-button").click();
  await measure(page, "dpr1 sheet");
  await ctx.close();
});
