import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const mockUserId = "0f6b257b-114a-4c79-9df2-bb5fd1a25e03";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    extraHTTPHeaders: {
      "x-altr-e2e-user": mockUserId,
      "x-altr-e2e-email": "ci@example.com",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    /**
     * Prompt 048 — 375px mobile viewport coverage for the two journeys
     * this prompt's own instructions name (visitor, new-user), not the
     * full suite: doubling every journey would roughly double e2e
     * runtime for little marginal value (most journeys assert on
     * server-driven state/contracts, not layout), and only `chromium`'s
     * browser binaries are installed in CI (`.github/workflows/ci.yml`:
     * `yarn playwright install --with-deps chromium`) — a named device
     * preset like `devices["iPhone 12"]` would silently switch the
     * `browserName` to `webkit`, which isn't installed there, so this
     * spreads `devices["Desktop Chrome"]` first (keeping chromium as the
     * engine) and only overrides `viewport`.
     */
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } },
      testMatch: ["**/journeys/visitor.spec.ts", "**/journeys/new-user.spec.ts"],
    },
  ],
  webServer: {
    command: "yarn start -p 3000",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ALTR_E2E_MOCKS: "1" },
  },
});
