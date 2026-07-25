import { test, expect } from "@playwright/test";
import { json, mockApi } from "../support";

/**
 * Billing journey (048) — checkout contract, success-never-upgrades,
 * overview states. Split across two reachability classes: `/pricing`,
 * `/payment/success`, and `/payment/cancel` are all outside `app/(app)/`
 * (043's own precedent) and get full content-level coverage below; the
 * authenticated `/billing` overview itself is inside `(app)/` and hits
 * the same placeholder-Supabase SSR block documented in `../support.ts`
 * — its own `test.describe.skip` block at the bottom is real, written
 * against `BillingOverview.test.tsx`'s own already-passing selectors,
 * ready to enable once this environment has real Supabase credentials.
 */
test.describe("billing journey", () => {
  // Security-semantic pin: checkout creation sends only the application's
  // own plan ID — never an amount, currency, or anything else a client
  // could tamper with. Named clearly so it isn't casually deleted.
  test("SECURITY PIN — checkout creation sends only { planId } and navigates to the returned checkoutUrl, landing on the real pending confirmation page", async ({ page }) => {
    await mockApi(page, async (path, route) => {
      if (path === "/api/billing/me") return route.fulfill(json({ effectivePlan: "free", hasPremium: false, subscription: null }));
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
    await expect(page.getByText("Payment received. Confirming your plan…")).toBeVisible({ timeout: 10_000 });
  });

  test("a signed-in user on Personal sees a quiet 'Your plan' label there, and a real checkout button on Work (plan-switch goes through checkout, not a dead state)", async ({ page }) => {
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

  // Security-semantic pin: the payment-return page never grants access
  // itself — it only ever reflects what the real, signature-verified
  // webhook already recorded, re-checked on every poll. Named clearly so
  // it isn't casually deleted.
  test("SECURITY PIN — payment success page never upgrades the plan — it only ever reflects what the server's own hasPremium says, re-checked, never assumed", async ({ page }) => {
    let calls = 0;
    await mockApi(page, (path, route) => {
      if (path === "/api/billing/me") {
        calls += 1;
        // Always the same honest non-premium state, no matter how many
        // times the page asks — this is the core assertion: the page
        // itself has no way to grant access, only to report it.
        return route.fulfill(json({ effectivePlan: "free", hasPremium: false, subscription: null }));
      }
      return route.continue();
    });

    await page.goto("/payment/success");

    await expect(page.getByText("Payment received. Confirming your plan…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/is active\.$/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Go to dashboard" })).toHaveCount(0);

    // Wait through a second real poll cycle (the component's own
    // unchanged 3-second interval) and re-assert the same honest state
    // — proving this isn't just a first-paint fluke.
    await page.waitForTimeout(3_500);
    expect(calls).toBeGreaterThanOrEqual(2);
    await expect(page.getByText("Payment received. Confirming your plan…")).toBeVisible();
    await expect(page.getByText(/is active\.$/)).toHaveCount(0);
  });

  test("payment success page shows the confirmed state only once the server's own hasPremium genuinely flips true", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/billing/me") return route.fulfill(json({ effectivePlan: "personal", hasPremium: true, subscription: { status: "active" } }));
      return route.continue();
    });

    await page.goto("/payment/success");

    await expect(page.getByText(/Personal.*is active\./)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", "/dashboard");
    await expect(page.getByText("Payment received. Confirming your plan…")).toHaveCount(0);
  });

  test("cancel page renders real no-blame content with working paths back to pricing and dashboard", async ({ page }) => {
    await page.goto("/payment/cancel");

    await expect(page.getByRole("heading", { name: "This checkout wasn't completed." })).toBeVisible();
    await expect(page.getByText("Nothing was charged.", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to pricing" })).toHaveAttribute("href", "/pricing");
    await expect(page.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/dashboard");
  });
});

test.describe.skip("billing journey — /billing overview (content-level e2e blocked — see file header; component coverage in BillingOverview.test.tsx)", () => {
  test("overview: a subscribed user sees plan status, renewal date, and can open the real billing portal", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/billing/me") {
        return route.fulfill(json({
          effectivePlan: "personal",
          hasPremium: true,
          entitlementReason: "active",
          subscription: { planId: "personal", status: "active", renewsAt: "2026-08-15T00:00:00.000Z", endsAt: null, trialEndsAt: null, cancelled: false, testMode: false, canManage: true },
          invoices: [],
        }));
      }
      if (path === "/api/billing/portal") return route.fulfill(json({ portalUrl: "https://billing.lemonsqueezy.com/portal/mock" }));
      return route.continue();
    });

    await page.goto("/billing");
    await expect(page.getByText(/Renews/)).toContainText("August 15, 2026");
    await expect(page.getByRole("button", { name: "Manage subscription" })).toBeVisible();
  });
});
