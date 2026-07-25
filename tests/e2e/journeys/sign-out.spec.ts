import { test, expect } from "@playwright/test";

/**
 * Sign-out journey (048) — protected-route gating and the real logout
 * contract. None of these seven pages have their content-level e2e
 * coverage here (`lib/supabase/middleware.ts`'s own `pages` list,
 * must-not-change) — middleware runs before route resolution, so the
 * redirect contract is real and verifiable regardless of what each page
 * itself later does; re-asserted here as a standing regression test so a
 * future prompt can't silently narrow the protected-page list without a
 * test failing.
 *
 * `SignOutButton` has no reachable page to click through for real e2e
 * (every page that mounts it — `AppNav`'s own `UserMenu` — is inside the
 * `(app)` group and hits the placeholder-Supabase SSR block documented
 * in `../support.ts`). What *is* real and live is the `/api/auth/logout`
 * contract itself (unmodified) that `SignOutButton` calls via
 * `signOutAccount()` — exercised directly via Playwright's `request`
 * fixture rather than faking a page to click a button on.
 */
test.describe("sign-out journey", () => {
  // Security-semantic pin: every protected route redirects an anonymous
  // visitor through real authentication, preserving the exact intended
  // destination — never renders protected content to a session that
  // doesn't exist. Named clearly so it isn't casually deleted.
  for (const path of ["/dashboard", "/memory", "/assistants", "/import-conversations", "/billing", "/payment/success", "/legacy-migration"]) {
    test(`SECURITY PIN — ${path} redirects an anonymous visitor to /auth?mode=login&next=<path>, preserving the exact path`, async ({ browser, baseURL }) => {
      // The global config's default `x-altr-e2e-user` is a real UUID
      // (signed in, for other journeys' own needs); this literal string
      // fails `getE2EIdentity()`'s UUID check, correctly simulating a
      // logged-out visitor instead.
      const context = await browser.newContext({
        extraHTTPHeaders: { "x-altr-e2e-user": "anonymous", "x-altr-e2e-email": "anonymous@example.com" },
      });
      const page = await context.newPage();
      await page.goto(`${baseURL}${path}`);
      await expect(page).toHaveURL(new RegExp(`/auth\\?mode=login&next=${encodeURIComponent(path)}$`));
      await context.close();
    });
  }

  test("the real /api/auth/logout contract returns { ok: true }, the exact shape signOutAccount()/SignOutButton depend on", async ({ request }) => {
    const response = await request.post("/api/auth/logout");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
