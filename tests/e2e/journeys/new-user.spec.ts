import { test, expect } from "@playwright/test";
import { json, mockApi, seedCookieConsent } from "../support";

/**
 * New-user journey (048) — register validation → the auth gate → (blocked:
 * onboarding, empty dashboard). Consolidates `critical-flows.spec.ts`'s
 * own `auth` and `password recovery` describes (025/026). There is no
 * separate "returning user"/"auth" slot among this prompt's own eight
 * named journeys, so every auth-mode test (register, login, recovery)
 * lives here — a new or returning user's first real interaction with the
 * product either way.
 *
 * `/onboarding` and `/dashboard` are both inside `app/(app)/` and hit the
 * same placeholder-Supabase SSR block every `(app)` route has had since
 * 029 (see `../support.ts`'s own `APP_GROUP_BLOCKED_PATHS` comment) —
 * genuine content-level coverage for "onboarding → empty dashboard" is
 * not possible in this environment. `OnboardingFlow.test.tsx` and
 * `DashboardHome.test.tsx` (RTL, mocked `fetch`) cover the actual content
 * this journey's own name refers to. No redirect test is written for
 * either path here — see the comment further down for a real, freshly-
 * confirmed finding about why `/onboarding` specifically can't get one.
 */
test.describe("new-user journey", () => {
  // /auth's own form sits low enough that the real global cookie banner
  // (045, fixed to the bottom of the viewport, appears 350ms after first
  // paint) can physically cover its submit button before a fast headless
  // click lands — found running this journey on the narrower `mobile`
  // project, where it's worse; a real user would face the same
  // interaction cost, resolved by making a real choice or scrolling.
  // Pre-seeding a stored preference (what a returning visitor's browser
  // would already have) keeps every test below focused on its own real
  // assertion instead.
  test.beforeEach(async ({ page }) => {
    await seedCookieConsent(page);
  });

  test("register mode: invalid email shows a role=alert error and never calls the server", async ({ page }) => {
    let registerCalled = false;
    await mockApi(page, (path, route) => {
      if (path === "/api/me") return route.fulfill(json({ profile: null }));
      if (path === "/api/auth/register") {
        registerCalled = true;
        return route.fulfill(json({ ok: true }));
      }
      return route.continue();
    });
    await page.goto("/auth");

    await expect(page.getByRole("heading", { name: "Create your Altr" })).toBeVisible();
    await page.getByLabel(/^Email/).fill("not-an-email");
    await page.getByLabel(/^Password/).fill("somepassword1");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.locator('p[role="alert"]')).toContainText("valid email");
    expect(registerCalled).toBe(false);
  });

  test("login mode: mode switch preserves typed input and the URL updates, with no server call yet", async ({ page }) => {
    await mockApi(page, (path, route) => (path === "/api/me" ? route.fulfill(json({ profile: null })) : route.continue()));
    await page.goto("/auth?mode=login");

    await page.getByLabel(/^Email/).fill("keep-me@example.com");
    await page.getByLabel(/^Password/).fill("keepme123");
    await page.getByRole("button", { name: "Create one" }).click();

    await expect(page.getByRole("heading", { name: "Create your Altr" })).toBeVisible();
    await expect(page.getByLabel(/^Email/)).toHaveValue("keep-me@example.com");
    await expect(page.getByLabel(/^Password/)).toHaveValue("keepme123");
    await expect(page).toHaveURL(/\/auth\?mode=register/);
  });

  test("login mode: a successful login navigates to the resolved ?next= path, not a hardcoded route", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/me") return route.fulfill(json({ profile: null }));
      if (path === "/api/auth/login") return route.fulfill(json({ ok: true, next: "/legacy-migration" }));
      return route.continue();
    });
    await page.goto("/auth?mode=login&next=%2Fpricing");

    await page.getByLabel(/^Email/).fill("real@example.com");
    await page.getByLabel(/^Password/).fill("realpassword1");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/pricing$/);
  });

  test("login mode: the exact 429 string both auth routes throw shows the calm rate-limited copy, not the raw server message", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/me") return route.fulfill(json({ profile: null }));
      if (path === "/api/auth/login") return route.fulfill(json({ error: "Забагато спроб. Спробуй пізніше." }, 429));
      return route.continue();
    });
    await page.goto("/auth?mode=login");

    await page.getByLabel(/^Email/).fill("real@example.com");
    await page.getByLabel(/^Password/).fill("realpassword1");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.locator('p[role="alert"]')).toContainText("Too many attempts");
  });

  test("already-authenticated visitor on /auth is redirected to /dashboard", async ({ page }) => {
    await mockApi(page, (path, route) => (path === "/api/me" ? route.fulfill(json({ profile: { id: "u1" } })) : route.continue()));
    await page.goto("/auth");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("forgot-password shows the identical neutral confirmation for both an existing and a non-existent account, with no dead click required to prove it", async ({ page }) => {
    let lastEmail = "";
    await mockApi(page, (path, route) => {
      if (path === "/api/auth/forgot-password") {
        lastEmail = route.request().postDataJSON().email;
        return route.fulfill(json({ ok: true, message: "Якщо акаунт існує, ми надіслали інструкції на email." }));
      }
      return route.continue();
    });
    await page.goto("/auth/forgot-password");

    await page.getByLabel(/^Email/).fill("real@example.com");
    await page.getByRole("button", { name: "Send instructions" }).click();

    await expect(page.getByText("Check your email")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("recovery link is on its way");
    expect(lastEmail).toBe("real@example.com");

    await page.goto("/auth/forgot-password");
    await page.getByLabel(/^Email/).fill("does-not-exist@example.com");
    await page.getByRole("button", { name: "Send instructions" }).click();

    await expect(page.getByText("Check your email")).toBeVisible();
  });

  /*
   * /dashboard's own anonymous-redirect is already covered by the
   * visitor journey (the visitor's own first encounter with the gate)
   * and the sign-out journey's full seven-path loop — not repeated here.
   *
   * `/onboarding` is deliberately given no redirect test at all, for a
   * real, freshly-confirmed reason: `lib/supabase/middleware.ts`'s own
   * hardcoded `pages` list (must-not-change) is `["/dashboard",
   * "/memory", "/assistants", "/import-conversations", "/billing",
   * "/payment/success", "/legacy-migration"]` — `/onboarding` was never
   * on it, even though it's a real `(app)` route needing the same
   * protection. Confirmed directly, not assumed: curling `/onboarding`
   * anonymously (no mock headers at all) against a freshly built-and-
   * started production server returns `500` (the same uncaught
   * `AUTH_REQUIRED` from `(app)/layout.tsx` every unlisted `(app)` route
   * hits), never the clean `307` a listed path like `/dashboard` gets.
   * This is the identical, already-documented `/settings`/
   * `/privacy-center` middleware-protection gap (030/045) — `/onboarding`
   * is a third, previously-unnoted member of it. Matching the precedent
   * those two already set (STATUS.md, 046/047): no e2e test is written
   * for a path that doesn't actually redirect cleanly, since a real
   * regression test must assert real, current behavior — this finding is
   * recorded in STATUS.md instead.
   */
});
