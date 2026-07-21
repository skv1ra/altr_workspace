import { test, expect, type Page, type Route } from "@playwright/test";

/*
 * Prompt 023 — pricing page. This file doesn't exist anywhere in this
 * workspace yet (`git log` on the path is empty, same as `tests/e2e/`
 * itself before Prompt 020 created `smoke.spec.ts`) — LEGACY's own
 * `tests/e2e/critical-flows.spec.ts` covers many flows (auth, dashboard,
 * memory, imports, drafts, sign-out) that don't exist in this workspace
 * yet either, so only its pricing/checkout tests are ported here, for
 * real, adapted to roles rather than raw text selectors. Future prompts
 * that build the other flows should add their own tests to this same
 * file rather than starting a third spec file.
 *
 * Same lightweight inline `mockApi` helper LEGACY used (route-intercept
 * every `/api/*` request, pass everything else through) — not extracted
 * to a shared file, since none is in this prompt's allowed files and
 * LEGACY itself kept it inline too.
 */

function json(body: unknown, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

async function mockApi(page: Page, handler: (path: string, route: Route) => Promise<void> | void) {
  await page.route("**/*", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/api/")) return handler(path, route);
    await route.continue();
  });
}

test.describe("pricing", () => {
  test("shows the real PLAN_LIMITS numbers for Free/Personal/Work, not placeholder text", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/billing/plans") return route.fulfill(json({ plans: [] }));
      if (path === "/api/billing/me") return route.fulfill(json({ error: "AUTH_REQUIRED" }, 500));
      return route.continue();
    });
    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: "One Altr. More capable with time." })).toBeVisible();
    // lib/billing/limits.ts's exact numbers — maxActiveMemories per plan.
    await expect(page.getByText("250", { exact: true })).toBeVisible();
    await expect(page.getByText("5,000", { exact: true })).toBeVisible();
    await expect(page.getByText("25,000", { exact: true })).toBeVisible();
  });

  test("unauthenticated visitor's checkout CTA is a real link to /auth?next=/pricing, matching LEGACY's own e2e regex — no dead click required to prove it", async ({
    page,
  }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/billing/plans") return route.fulfill(json({ plans: [] }));
      // The real `/api/billing/me` — and, more importantly, `/api/billing/plans`
      // itself, which is meant to be public — currently 401 for every
      // anonymous request: `lib/supabase/middleware.ts`'s `protectedPath()`
      // treats any `/api/*` route as auth-required unless explicitly
      // allowlisted, and billing routes aren't on that list, even though
      // neither route's own handler code requires auth for `plans`. A real,
      // pre-existing bug (confirmed directly against a running server, not
      // just read from code) — out of this prompt's allowed files to fix
      // (`lib/supabase/middleware.ts`) — see STATUS.md. Mocked here as a
      // generic 401 (this component treats any non-2xx from `/api/billing/me`
      // as "not signed in" regardless of the exact code) so this test still
      // exercises the real client-side behavior correctly.
      if (path === "/api/billing/me") return route.fulfill(json({ error: "AUTH_REQUIRED" }, 401));
      return route.continue();
    });
    await page.goto("/pricing");

    const checkoutLink = page.getByRole("link", { name: "Continue to checkout" }).first();
    await expect(checkoutLink).toHaveAttribute("href", "/auth?next=/pricing");
    // Header (Prompt 019) also has its own "Create your Altr" link — the
    // Free column's own copy of it is the last one in DOM order.
    const registerLink = page.getByRole("link", { name: "Create your Altr" }).last();
    await expect(registerLink).toHaveAttribute("href", "/auth?mode=register");
  });

  test("checkout creation sends only { planId } and navigates to the returned checkoutUrl (LEGACY's own contract, unchanged)", async ({
    page,
  }) => {
    await mockApi(page, async (path, route) => {
      if (path === "/api/billing/me") return route.fulfill(json({ effectivePlan: "free" }));
      if (path === "/api/billing/plans") return route.fulfill(json({ plans: [] }));
      if (path === "/api/billing/checkout") {
        expect(route.request().postDataJSON()).toEqual({ planId: "personal" });
        return route.fulfill(json({ checkoutUrl: "http://127.0.0.1:3000/payment/success?mock=1" }));
      }
      return route.continue();
    });
    await page.goto("/pricing");

    await page.getByRole("button", { name: "Continue to checkout" }).first().click();
    await expect(page).toHaveURL(/\/payment\/success\?mock=1/);
  });

  test("a signed-in user on Personal sees a quiet 'Your plan' label there, and a real checkout button on Work (plan-switch goes through checkout, not a dead state)", async ({
    page,
  }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/billing/plans") return route.fulfill(json({ plans: [] }));
      if (path === "/api/billing/me") return route.fulfill(json({ effectivePlan: "personal" }));
      return route.continue();
    });
    await page.goto("/pricing");

    await expect(page.getByText("Your plan")).toBeVisible();
    await expect(page.getByText("Included with every account")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue to checkout" })).toBeVisible();
  });

  test("/api/billing/plans unavailable falls back to static pricing with a quiet retry, and disables checkout CTAs (no dead buttons left enabled on stale data)", async ({
    page,
  }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/billing/plans") return route.fulfill({ status: 500, body: "" });
      if (path === "/api/billing/me") return route.fulfill(json({ effectivePlan: "free" }));
      return route.continue();
    });
    await page.goto("/pricing");

    await expect(page.getByText(/couldn.t confirm live pricing/i)).toBeVisible();
    // Static fallback amounts (lib/billing/plans.ts's knownPlanDisplay)
    // still render — the page never goes blank on this failure.
    await expect(page.getByText("$20")).toBeVisible();
    await expect(page.getByText("$40")).toBeVisible();
    for (const button of await page.getByRole("button", { name: "Continue to checkout" }).all()) {
      await expect(button).toBeDisabled();
    }
  });
});

/*
 * Prompt 025 — auth screens. LEGACY's own `tests/e2e/critical-flows.spec.ts`
 * has a "registration form validation"/"login form validation" pair, but
 * both target selectors that don't match LEGACY's own *current* auth page
 * source (button text "Створити другого себе" / heading "Повернись до
 * свого Altr" appear nowhere in the actual `app/auth/page.tsx` read for
 * this prompt, which uses "Створити акаунт" and "З поверненням" — LEGACY's
 * e2e spec is stale relative to its own app, not a contract this prompt can
 * literally port). Ported the underlying *behavior* those tests were
 * actually checking (bad input -> a role=alert error, no server call)
 * against this prompt's own real selectors instead, per this prompt's own
 * "update selectors, keep the same assertions" instruction. The
 * "protected route redirects anonymous users" test, unlike those two, does
 * match a real, currently-passing contract in `lib/supabase/middleware.ts`
 * (unmodified) — ported as close to verbatim as this workspace's own
 * `x-altr-e2e-user` mock-auth mechanism (`lib/testing/e2e-auth.ts`) allows.
 */
test.describe("auth", () => {
  test("protected route redirects anonymous users to /auth?mode=login&next=...", async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { "x-altr-e2e-user": "anonymous", "x-altr-e2e-email": "anonymous@example.com" },
    });
    const page = await context.newPage();
    await page.goto(`${baseURL}/dashboard`);
    await expect(page).toHaveURL(/\/auth\?mode=login&next=%2Fdashboard/);
    await context.close();
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

  test("login mode: mode switch preserves typed input and the URL updates, with no server call yet", async ({
    page,
  }) => {
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

  test("login mode: a successful login navigates to the resolved ?next= path, not a hardcoded route", async ({
    page,
  }) => {
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

  test("login mode: the exact 429 string both auth routes throw shows the calm rate-limited copy, not the raw server message", async ({
    page,
  }) => {
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
    await mockApi(page, (path, route) =>
      path === "/api/me" ? route.fulfill(json({ profile: { id: "u1" } })) : route.continue(),
    );
    await page.goto("/auth");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
