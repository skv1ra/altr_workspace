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
