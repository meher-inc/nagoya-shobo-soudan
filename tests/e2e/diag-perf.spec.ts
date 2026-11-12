// 一時的な計測（plan 20261112-webkit-e2e-stability）。どの層が WebKit の1フレームを重くしているかを測る。マージ前に消す
import { expect, test, type Page } from "@playwright/test";

const NB = "backdrop-filter:none!important;-webkit-backdrop-filter:none!important";
const G = ".glass";
const variants2: [string, string][] = [
  ["base", ""],
  ["noScrimBlur", `.scrim{${NB}}`],
  ["noSheetBlur", `.sheet{${NB}}`],
  ["noUnderGlass", `.glass:not(.sheet){${NB}}`],
  ["blurOnly", `${G}{backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important}`],
  ["noGlassPseudo", ".glass::before,.glass::after{display:none!important}"],
  ["noGlassShadow", `${G}{box-shadow:none!important}`],
  ["noIsolation", `${G}{isolation:auto!important}`],
  ["noAmbient", ".ambient{display:none!important}"],
  ["allBackdropNone", `.glass,.scrim{${NB}}`],
];

/** 次のフレームが2枚続けて 40ms 未満になるまでの時間（層の作り直しの重さ） */
async function settle(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((res) => {
        const s = performance.now();
        let last = s;
        let ok = 0;
        const f = () => {
          const now = performance.now();
          ok = now - last < 40 ? ok + 1 : 0;
          last = now;
          if (ok >= 2 || now - s > 120_000) res(Math.round(now - s));
          else requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }),
  );
}

/** シートの中の1要素の色を変えて、それが描かれるまで（2フレーム）の時間を3回 */
async function change(page: Page): Promise<number[]> {
  return page.evaluate(async () => {
    const el = document.querySelector<HTMLElement>(".sheet button, .sheet a") ?? document.body;
    const out: number[] = [];
    for (let i = 0; i < 3; i++) {
      const s = performance.now();
      el.style.color = i % 2 ? "rgb(10, 20, 30)" : "rgb(200, 10, 10)";
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      out.push(Math.round(performance.now() - s));
    }
    el.style.color = "";
    return out;
  });
}

async function setCss(page: Page, css: string) {
  await page.evaluate((css) => {
    document.getElementById("diagv")?.remove();
    const s = document.createElement("style");
    s.id = "diagv";
    s.textContent = css;
    document.head.appendChild(s);
  }, css);
}

async function measure2(page: Page, label: string) {
  await settle(page);
  for (const [name, css] of variants2) {
    const t0 = Date.now();
    await setCss(page, css);
    const apply = await settle(page);
    const ch = await change(page);
    await setCss(page, "");
    const revert = await settle(page);
    console.log(`[perf2] ${label} ${name} apply=${apply}ms change=${ch.join(",")} revert=${revert}ms wall=${Date.now() - t0}ms`);
  }
}

for (const motion of ["reduce", "no-preference"] as const) {
  test(`diag perf ${motion} @local`, async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-safari" && !process.env.DIAG_ANY, "WebKit only");
    test.setTimeout(900_000);
    await page.context().setExtraHTTPHeaders({ "x-test-ip": `198.51.100.${Math.floor(Math.random() * 250)}-${Date.now()}` });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/");
    await page.getByTestId("composer-input").fill("防火対象物使用開始届を作成してほしいです");
    await page.getByTestId("send-button").click();
    const reply = page.getByTestId("msg-assistant").last();
    await expect(reply.getByRole("button", { name: "コピー" })).toBeVisible({ timeout: 120_000 });
    await measure2(page, `${motion} answer`);
    await reply.getByTestId("handoff-card").getByTestId("handoff-open").click();
    await expect(page.getByTestId("handoff-sheet")).toBeVisible();
    await measure2(page, `${motion} handoff-sheet`);
  });
}

// :278 の `TypeError: Load failed` の出どころの確認。待たれていない fetch を飛ばした直後に画面を移る（refreshMe と同じ形）
test("diag load-failed on navigation @local", async ({ page }) => {
  test.skip(test.info().project.name !== "mobile-safari" && !process.env.DIAG_ANY, "WebKit only");
  await page.context().setExtraHTTPHeaders({ "x-test-ip": `198.51.100.9-${Date.now()}` });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror:${e.name}:${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console:${m.text()}`));
  page.on("requestfailed", (r) => console.log(`[perf] requestfailed ${r.url()} ${r.failure()?.errorText}`));
  for (const handled of [false, true]) {
    errors.length = 0;
    await page.goto("/");
    await page.evaluate((handled) => {
      for (let i = 0; i < 10; i++) {
        const p = fetch(`/api/me?n=${i}`).then((r) => r.json());
        if (handled) p.catch(() => {});
      }
    }, handled);
    await page.goto(`/auth/test-login?email=diag-${Date.now()}@example.com&next=/`);
    await page.waitForTimeout(1000);
    console.log(`[perf] load-failed handled=${handled} errors=${JSON.stringify(errors)}`);
  }
});
