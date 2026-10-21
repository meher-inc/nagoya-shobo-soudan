import { test, expect, type Page } from "@playwright/test";

// 各都市のサイトへの移動は外へ出さず、届いた URL だけ確かめる
async function stubCities(page: Page) {
  const hits: string[] = [];
  await page.route(/^https:\/\/[a-z]+\.todokede\.jp\//, (route) => {
    hits.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<title>city</title>ok" });
  });
  return hits;
}

test("開いた瞬間に入力欄にフォーカスがあり、スケルトンが消える", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#input")).toBeFocused();
  await expect(page.getByTestId("skeleton")).toHaveCount(0);
  await expect(page.locator("h1, h2")).toHaveCount(0);
  await expect(page.locator(".chip")).toHaveCount(4);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("地域を選ぶ前に送ると地域の選択が開き、選ぶとその都市へ質問を渡す", async ({ page }) => {
  const hits = await stubCities(page);
  await page.goto("/");
  await expect(page.getByTestId("city-pill")).toHaveText(/地域を選択/);
  await page.locator("#input").fill("飲食店を開くときの届出は？");
  await page.locator("#send").click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await sheet.getByRole("link", { name: /名古屋市/ }).click();
  await page.waitForURL(/nagoya\.todokede\.jp/);
  expect(hits[0]).toBe(`https://nagoya.todokede.jp/?q=${encodeURIComponent("飲食店を開くときの届出は？")}`);
});

test("選んだ地域を覚えていて、質問の候補からすぐ相談に進む", async ({ page }) => {
  const hits = await stubCities(page);
  await page.goto("/");
  await page.getByTestId("city-pill").click();
  await page.getByRole("dialog").getByRole("link", { name: /大阪市/ }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByTestId("city-pill")).toHaveText(/大阪市/);
  await page.reload();
  await expect(page.getByTestId("city-pill")).toHaveText(/大阪市/);
  await page.locator(".chip").first().click();
  await page.waitForURL(/osaka\.todokede\.jp/);
  expect(hits[0]).toContain("https://osaka.todokede.jp/?q=");
});

test("地域の一覧は公開済みの都市へのリンクで、Escape で閉じる", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("city-pill").click();
  const links = page.getByRole("dialog").getByRole("link").filter({ hasText: /市|都/ });
  await expect(links).toHaveCount(6);
  await expect(page.getByRole("link", { name: /京都市/ })).toHaveAttribute("href", "https://kyoto.todokede.jp/");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("検索エンジン向けの情報（説明・OGP・サイトマップ）がある", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain('href="https://fukuoka.todokede.jp/"');
  expect(html).toContain('property="og:image"');
  expect(html).not.toContain("%ORIGIN%");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<urlset");
  expect((await request.get("/robots.txt")).ok()).toBeTruthy();
  expect((await request.get("/og.png")).headers()["content-type"]).toContain("image/png");
  await page.goto("/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /消防/);
});
