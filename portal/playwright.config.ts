import { defineConfig, devices } from "@playwright/test";

const PORT = 8788;
const remote = process.env.BASE_URL;
// Playwright の CDN に届かない環境では、入っている Chromium を指定する（WebKit は CI だけで動かす）
const chromiumPath = process.env.CHROMIUM_PATH;
const chromium = chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: remote ?? `http://localhost:${PORT}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "mobile-chrome", use: { ...devices["Pixel 7"], ...chromium } },
    ...(chromiumPath ? [] : [{ name: "mobile-safari", use: { ...devices["iPhone 15"] } }]),
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"], ...chromium } },
  ],
  webServer: remote
    ? undefined
    : {
        command: `wrangler dev --port ${PORT} --var CANONICAL_ORIGIN:http://localhost:${PORT}`,
        url: `http://localhost:${PORT}/`,
        timeout: 120_000,
        reuseExistingServer: false,
      },
});
