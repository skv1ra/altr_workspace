import { test, expect } from "@playwright/test";
import { json, mockApi } from "../support";

/**
 * Visitor journey (048) — landing → pricing → the auth gate. Consolidates
 * `smoke.spec.ts` (020/021/022/024) and the anonymous-only half of
 * `critical-flows.spec.ts`'s own `pricing` describe (023) into one file,
 * organized by the actual user path rather than by which prompt happened
 * to add each assertion. Every selector is role/testid-based already
 * (no raw text-CSS locators anywhere in the source this was consolidated
 * from) — the one text-content assertion style kept (`getByText`) is for
 * verifying real rendered copy exists, not for locating an element to
 * interact with, which is a different concern than the "no text-locale
 * coupling" instruction targets.
 */
test.describe("visitor journey", () => {
  test("homepage renders the header, hero, product, how-it-works, memory, twin, and privacy sections", async ({ page }) => {
    await page.goto("/");

    // `.first()`: Footer (024) repeats this same "Altr home" home link in
    // its own brand mark, so the header's copy is no longer the only match.
    await expect(page.getByRole("link", { name: "Altr home" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your past learns to remain." })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Your history becomes memory/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Three movements, always in your control/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /What Altr remembers, plainly/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /A draft, in your voice/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Specific guarantees, not vague promises/ })).toBeVisible();
  });

  test("header nav links point at real or intentionally-deferred targets, no accidental dead hrefs", async ({ page }, testInfo) => {
    // The desktop `nav[aria-label="Primary"]` is `display:none` below
    // the header's own responsive breakpoint and replaced by the mobile
    // menu sheet instead (a genuinely different DOM subtree, not just
    // hidden) — the "mobile menu opens..." test below already covers the
    // equivalent links there.
    test.skip(testInfo.project.name === "mobile", "desktop Primary nav doesn't exist at mobile width; see the mobile menu test instead");
    await page.goto("/");
    const primaryNav = page.getByRole("navigation", { name: "Primary" }).first();

    await expect(primaryNav.getByRole("link", { name: "Product" })).toHaveAttribute("href", "/#product");
    await expect(primaryNav.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/#how-it-works");
    await expect(primaryNav.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
    await expect(page.getByRole("link", { name: "Log in" }).first()).toHaveAttribute("href", "/auth?mode=login");
    await expect(page.getByRole("link", { name: "Create your Altr" }).first()).toHaveAttribute("href", "/auth?mode=register");
  });

  test("the Product header link scrolls to a live, in-page #product section", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "desktop Primary nav doesn't exist at mobile width; see the mobile menu test instead");
    await page.goto("/");
    const primaryNav = page.getByRole("navigation", { name: "Primary" }).first();

    await primaryNav.getByRole("link", { name: "Product" }).click();
    await expect(page).toHaveURL(/#product$/);
    await expect(page.locator("#product")).toBeInViewport();
    await expect(page.getByRole("heading", { name: /Your history becomes memory/ })).toBeInViewport();
  });

  test("landing directly on /#product shows the section already in view, no dead scroll", async ({ page }) => {
    await page.goto("/#product");
    await expect(page.locator("#product")).toBeInViewport();
  });

  test("the How it works header link resolves to a live #how-it-works section", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "desktop Primary nav doesn't exist at mobile width; see the mobile menu test instead");
    await page.goto("/");
    const primaryNav = page.getByRole("navigation", { name: "Primary" }).first();

    await primaryNav.getByRole("link", { name: "How it works" }).click();
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect(page.locator("#how-it-works")).toBeInViewport();
    await expect(page.getByRole("heading", { name: /Three movements, always in your control/ })).toBeInViewport();
  });

  test("the memory demo renders fictional memories with no dead interactive controls", async ({ page }) => {
    await page.goto("/#memory");
    const section = page.locator("#memory");
    await expect(section).toBeInViewport();
    await expect(section.getByText("Short, direct replies")).toBeVisible();
    await expect(section.getByText("Editing")).toBeVisible();
    await expect(section.getByRole("button")).toHaveCount(0);
  });

  test("the Twin demo shows the draft-only label and no send button", async ({ page }) => {
    await page.goto("/#twin");
    const section = page.locator("#twin");
    await expect(section).toBeInViewport();
    await expect(section.getByText("Draft — you decide what sends")).toBeVisible();
    await expect(section.getByRole("figure")).toBeVisible();
    await expect(section.getByRole("button")).toHaveCount(0);
  });

  test("the privacy section lists its guarantees and links to /privacy, with no unverifiable training claim", async ({ page }) => {
    await page.goto("/#privacy");
    const section = page.locator("#privacy");
    await expect(section).toBeInViewport();
    await expect(section.getByText("Parsed in your browser", { exact: true })).toBeVisible();
    await expect(section.getByText("Scoped to you", { exact: true })).toBeVisible();
    await expect(section.getByText("Never sent without you", { exact: true })).toBeVisible();
    await expect(section.getByText("Yours to export or delete", { exact: true })).toBeVisible();
    await expect(section.getByRole("link", { name: "Read the full privacy policy" })).toHaveAttribute("href", "/privacy");
    await expect(section.getByText(/train/i)).toHaveCount(0);
  });

  test("mobile menu opens with the same nav links and closes on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Product" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Create your Altr" })).toHaveAttribute("href", "/auth?mode=register");

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("pricing shows the real PLAN_LIMITS numbers for Free/Personal/Work, not placeholder text", async ({ page }) => {
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

  // Security-semantic pin: an anonymous visitor's checkout path always
  // routes through real authentication first — never a client-side plan
  // grant. Named clearly so it isn't casually deleted.
  test("SECURITY PIN — unauthenticated visitor's checkout CTA is a real link to /auth?next=/pricing, no dead click required to prove it", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/billing/plans") return route.fulfill(json({ plans: [] }));
      // `lib/supabase/middleware.ts`'s `protectedPath()` treats any
      // `/api/*` route as auth-required unless explicitly allowlisted,
      // and billing routes aren't on that list — a real, pre-existing,
      // out-of-scope-to-fix bug (STATUS.md, 023) mocked here as a
      // generic 401 since the component treats any non-2xx the same way.
      if (path === "/api/billing/me") return route.fulfill(json({ error: "AUTH_REQUIRED" }, 401));
      return route.continue();
    });
    await page.goto("/pricing");

    const checkoutLink = page.getByRole("link", { name: "Continue to checkout" }).first();
    await expect(checkoutLink).toHaveAttribute("href", "/auth?next=/pricing");
    // Header (019) also has its own "Create your Altr" link — the Free
    // column's own copy of it is the last one in DOM order.
    const registerLink = page.getByRole("link", { name: "Create your Altr" }).last();
    await expect(registerLink).toHaveAttribute("href", "/auth?mode=register");
  });

  test("/api/billing/plans unavailable falls back to static pricing with a quiet retry, and disables checkout CTAs (no dead buttons left enabled on stale data)", async ({ page }) => {
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

  // Security-semantic pin: every protected page redirects an anonymous
  // visitor through real authentication — never renders protected
  // content to a session that doesn't exist. The full path list (all
  // seven real `(app)`-adjacent protected routes) is exercised together
  // in the sign-out journey; this one is the visitor's own first real
  // encounter with the gate, kept here for that reason.
  test("SECURITY PIN — a protected route redirects an anonymous visitor to /auth?mode=login&next=..., preserving the exact path", async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { "x-altr-e2e-user": "anonymous", "x-altr-e2e-email": "anonymous@example.com" },
    });
    const page = await context.newPage();
    await page.goto(`${baseURL}/dashboard`);
    await expect(page).toHaveURL(/\/auth\?mode=login&next=%2Fdashboard/);
    await context.close();
  });
});
