import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../src/shared/consent";

// 無料期間と上限の回避対策・退会・日別の集計（テスト用ログインが有効な環境のみ）
const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const email = () => `e2e-${uniq()}@example.com`;
const testIp = () => `203.0.113.${Math.floor(Math.random() * 250)}-${uniq()}`;
// staging はテスト用の Turnstile キー（どのトークンでも成功）を使うため、ダミーのトークンを添える
const TEST_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const chat = (request: APIRequestContext, turnstile = TEST_TOKEN) =>
  request.post("/api/chat", { data: { message: "消火器の点検は？", terms: CONSENT_VERSION, turnstile } });
const me = async (request: APIRequestContext) => (await request.get("/api/me")).json();
const testLogin = (request: APIRequestContext, address: string) => request.get(`/auth/test-login?email=${encodeURIComponent(address)}&next=/`);

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ "x-test-ip": testIp() });
});

test("退会すると履歴とアカウントが消え、同じ Google アカウントで登録し直しても無料期間は復活しない @test-login", async ({ page }) => {
  const address = email();
  await testLogin(page.request, address);
  const sent = await chat(page.request);
  expect(sent.status()).toBe(200);
  await sent.body();
  await page.request.post("/api/test/trial", { data: { hoursAgo: 25 } });
  expect((await me(page.request)).access).toBe("expired");

  // 画面の退会: メニュー → 退会する → 確認
  await page.goto("/");
  await page.getByTestId("menu-button").click();
  await page.getByTestId("delete-account").click();
  await expect(page.getByTestId("delete-sheet")).toContainText("元に戻せません");
  await page.getByTestId("delete-confirm").click();
  await expect(page.getByTestId("toast")).toContainText("退会しました");
  expect((await me(page.request)).hasSession).toBe(false);

  await testLogin(page.request, address);
  const again = await me(page.request);
  expect(again.user.email).toBe(address);
  expect(again.access).toBe("expired");
  expect((await page.request.get("/api/conversations")).ok()).toBeTruthy();
  expect((await (await page.request.get("/api/conversations")).json()).conversations).toHaveLength(0);
  expect((await chat(page.request)).status()).toBe(402);
});

test("無料期間中に退会して登録し直した場合は、残りの時間だけ使える @test-login", async ({ request }) => {
  const address = email();
  await testLogin(request, address);
  await request.post("/api/test/trial", { data: { hoursAgo: 2 } });
  expect((await request.delete("/api/account")).status()).toBe(200);
  await testLogin(request, address);
  const data = await me(request);
  expect(data.access).toBe("trial");
  expect(data.trialEndsAt - Date.now()).toBeLessThan(22.1 * 3600_000);
});

test("一度も相談せずに退会した場合は、登録し直すと最初の相談から 24 時間使える @test-login", async ({ request }) => {
  const address = email();
  await testLogin(request, address);
  expect((await request.delete("/api/account")).status()).toBe(200);
  await testLogin(request, address);
  const data = await me(request);
  expect(data.access).toBe("trial");
  expect(data.trialEndsAt).toBeNull();
});

test("月額プランの利用者が退会すると、Stripe の契約を直ちに解約する @local", async ({ page }) => {
  const address = email();
  await testLogin(page.request, address);
  await page.request.post("/api/test/trial", { data: { hoursAgo: 25 } });
  await page.goto("/");
  await page.getByTestId("menu-button").click();
  await page.getByTestId("plan-row").click();
  await page.getByTestId("checkout-button").click();
  await expect(page).toHaveTitle("Mock Checkout");
  await page.locator("#pay").click();
  await expect(page.getByTestId("toast")).toContainText("お支払いが完了しました");
  const subs = async () => (await (await page.request.get(`http://localhost:12111/test/subscriptions?email=${encodeURIComponent(address)}`)).json()) as { status: string }[];
  expect((await subs()).map((s) => s.status)).toEqual(["active"]);

  await page.getByTestId("menu-button").click();
  await page.getByTestId("delete-account").click();
  await expect(page.getByTestId("delete-sheet")).toContainText("日割りでの返金はありません");
  await page.getByTestId("delete-confirm").click();
  await expect(page.getByTestId("toast")).toContainText("退会しました");
  expect((await subs()).map((s) => s.status)).toEqual(["canceled"]);
});

test("匿名ユーザーは退会 API を使えない", async ({ request }) => {
  expect((await request.delete("/api/account")).status()).toBe(401);
});

test("Turnstile が有効な環境では、トークンのない匿名の送信を断り、匿名ユーザーも作らない", async ({ request }) => {
  const data = await me(request);
  test.skip(!data.turnstileSiteKey, "Turnstile のキーが設定された環境（staging）のみ");
  const res = await chat(request, "");
  expect(res.status()).toBe(401);
  expect((await res.json()).error).toBe("login_required");
  expect((await me(request)).hasSession).toBe(false);
});

test("管理画面に日別の無料開始・24時間以降の再訪・Googleログインが数えられる @test-login", async ({ page, browser }) => {
  const read = async (p: Page) => {
    await testLogin(p.request, "s.maru0714@gmail.com");
    await p.goto("/admin");
    const table = p.locator("h2:has-text('日別の利用') + table");
    await expect(table.locator("th")).toHaveText(["日付", "無料開始", "24時間以降に再訪", "Googleログイン", "課金開始"]);
    const rows = table.locator("tr");
    if ((await rows.count()) < 2) return [0, 0, 0, 0];
    return (await rows.nth(1).locator("td").allTextContents()).slice(1).map(Number);
  };
  const before = await read(page);

  const ctx = await browser.newContext({ extraHTTPHeaders: { "x-test-ip": testIp() } });
  const user = await ctx.newPage();
  await testLogin(user.request, email());
  const sent = await chat(user.request);
  expect(sent.status()).toBe(200);
  await sent.body();
  await user.request.post("/api/test/trial", { data: { hoursAgo: 25 } });
  await user.request.get("/api/me");
  await user.request.get("/api/me");
  await ctx.close();

  const after = await read(page);
  // 無料開始 +1、再訪 +1（2 回目の訪問は数えない）、Google ログイン +2（利用者 1 回と管理者の再ログイン 1 回）
  expect(after[0] - before[0]).toBe(1);
  expect(after[1] - before[1]).toBe(1);
  expect(after[2] - before[2]).toBe(2);
});

test("管理画面は管理者以外に見せない", async ({ request }) => {
  expect((await request.get("/admin")).status()).toBe(403);
});
