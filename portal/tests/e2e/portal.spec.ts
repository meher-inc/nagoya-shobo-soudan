import { test, expect, type Page } from "@playwright/test";

const CITIES = [
  ["札幌市", "sapporo"],
  ["東京都", "tokyo"],
  ["名古屋市", "nagoya"],
  ["京都市", "kyoto"],
  ["大阪市", "osaka"],
  ["福岡市", "fukuoka"],
] as const;

// 各都市のサイトへの移動は外へ出さず、届いた URL だけ確かめる
async function stubCities(page: Page) {
  const hits: string[] = [];
  await page.route(/^https:\/\/[a-z]+\.todokede\.jp\//, (route) => {
    hits.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<title>city</title>ok" });
  });
  return hits;
}

// カードの出現アニメーション（scale・translate を少しずつ遅らせて動かす）が終わってから位置を測る。
// 背景の光（.ambient）は無限に動くので待たない
async function settle(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => {
          const t = (a.effect as KeyframeEffect | null)?.target;
          return t instanceof Element && !t.closest(".ambient");
        })
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
}

test("最初の画面で地域の選び方がわかり、入力欄が無い", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("どの地域の消防の届出を調べますか");
  await expect(page.getByText("トドケデ AI", { exact: true })).toBeVisible();
  await expect(page.getByText("消防法務AIエージェント")).toBeVisible();
  await expect(page.locator("textarea, input, form")).toHaveCount(0);
  // 都市版がない地域は全国版へ
  await expect(page.locator("#other")).toHaveAttribute("href", "https://zenkoku.todokede.jp/");
  await expect(page.locator("#other")).toContainText("上記以外の地域");
  await expect(page.getByTestId("suggest")).toBeHidden();
  // 6都市のカードがファーストビューに収まる
  await settle(page);
  const last = await page.locator("#cities a").last().boundingBox();
  expect(last!.y + last!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
});

test("6都市のカードは北から順に並び、各都市のサイトへのリンク", async ({ page }) => {
  await page.goto("/");
  const links = page.locator("#cities a");
  await expect(links).toHaveCount(6);
  await settle(page);
  for (const [i, [name, slug]] of CITIES.entries()) {
    await expect(links.nth(i)).toContainText(name);
    await expect(links.nth(i)).toHaveAttribute("href", `https://${slug}.todokede.jp/`);
    const box = await links.nth(i).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test("スマホでは2列、PCでは3列で、横スクロールが無い", async ({ page }, info) => {
  await page.goto("/");
  const cols = info.project.name.startsWith("desktop") ? 3 : 2;
  // レイアウト上の列（transform の影響を受けない）
  const layoutCols = await page.locator("#cities > li").evaluateAll((els) => new Set(els.map((e) => (e as HTMLElement).offsetLeft)).size);
  expect(layoutCols).toBe(cols);
  // 画面に見えている列（アニメーションが終わってから測る）
  await settle(page);
  const xs = await page.locator("#cities a").evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().x))).size);
  expect(xs).toBe(cols);
  for (const width of [360, page.viewportSize()!.width]) {
    await page.setViewportSize({ width, height: 740 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test("選んだ地域を端末に保存し、次に開くと「前回選んだ地域」として上に出す", async ({ page }) => {
  const hits = await stubCities(page);
  await page.goto("/");
  await page.locator("#cities").getByRole("link", { name: /大阪市/ }).click();
  await page.waitForURL(/osaka\.todokede\.jp/);
  expect(hits[0]).toBe("https://osaka.todokede.jp/");
  await page.goto("/");
  const suggest = page.getByTestId("suggest");
  await expect(suggest).toBeVisible();
  await expect(suggest).toContainText("前回選んだ地域");
  await expect(suggest.getByRole("link")).toHaveAttribute("href", "https://osaka.todokede.jp/");
  await expect(suggest.getByRole("link")).toContainText("大阪市");
});

test("推定はせず、初めての人には前回の地域を出さない", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  expect(html).not.toContain("data-guess");
  expect(html).not.toContain("お近くの地域");
  await page.goto("/");
  await expect(page.getByTestId("suggest")).toBeHidden();
});

test("検索エンジン向けの情報（説明・OGP・サイトマップ）がある", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  for (const [, slug] of CITIES) expect(html).toContain(`href="https://${slug}.todokede.jp/"`);
  expect(html).not.toContain("?q=");
  expect(html).toContain('property="og:image"');
  expect(html).not.toContain("%ORIGIN%");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<urlset");
  expect((await request.get("/robots.txt")).ok()).toBeTruthy();
  expect((await request.get("/og.png")).headers()["content-type"]).toContain("image/png");
  await page.goto("/");
  await expect(page).toHaveTitle(/トドケデ AI/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /消防/);
});
