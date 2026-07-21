import { test, expect } from "@playwright/test";

/*
 * Prompt 020: no dedicated homepage-content block actually existed in
 * LEGACY's `tests/e2e/critical-flows.spec.ts` to port — every test there
 * navigates to `/auth`, `/dashboard`, `/pricing`, `/memory`, etc.; `/`
 * only ever appears as a post-sign-out redirect target (`toHaveURL(/\/$/)`),
 * never asserted against for content. This file is genuinely new
 * coverage for what this prompt actually ships, in the spirit of "port
 * the LEGACY homepage blocks" even though there was nothing homepage-
 * specific to literally port — role/testid-based selectors throughout,
 * per ADR-006/011's own migration instruction for ported specs.
 */

test("homepage renders the header, hero, product, how-it-works, and memory sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Altr home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your past learns to remain." })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Your history becomes memory/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Three movements, always in your control/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /What Altr remembers, plainly/ })).toBeVisible();
});

test("header nav links point at real or intentionally-deferred targets, no accidental dead hrefs", async ({
  page,
}) => {
  await page.goto("/");
  const primaryNav = page.getByRole("navigation", { name: "Primary" }).first();

  await expect(primaryNav.getByRole("link", { name: "Product" })).toHaveAttribute("href", "/#product");
  await expect(primaryNav.getByRole("link", { name: "How it works" })).toHaveAttribute(
    "href",
    "/#how-it-works",
  );
  await expect(primaryNav.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
  await expect(page.getByRole("link", { name: "Log in" }).first()).toHaveAttribute(
    "href",
    "/auth?mode=login",
  );
  await expect(page.getByRole("link", { name: "Create your Altr" }).first()).toHaveAttribute(
    "href",
    "/auth?mode=register",
  );
});

test("the Product header link scrolls to a live, in-page #product section", async ({ page }) => {
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

// Prompt 020's own dead-link ledger flagged "#how-it-works" as
// unresolved, waiting on 021 — this closes that specific item.
test("the How it works header link now resolves to a live #how-it-works section (was a dead anchor before this prompt)", async ({
  page,
}) => {
  await page.goto("/");
  const primaryNav = page.getByRole("navigation", { name: "Primary" }).first();

  await primaryNav.getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(page.locator("#how-it-works")).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: /Three movements, always in your control/ }),
  ).toBeInViewport();
});

test("the memory demo renders fictional memories with no dead interactive controls", async ({ page }) => {
  await page.goto("/#memory");
  const section = page.locator("#memory");
  await expect(section).toBeInViewport();
  await expect(section.getByText("Short, direct replies")).toBeVisible();
  await expect(section.getByText("Editing")).toBeVisible();
  await expect(section.getByRole("button")).toHaveCount(0);
});

test("mobile menu opens with the same nav links and closes on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Product" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Create your Altr" })).toHaveAttribute(
    "href",
    "/auth?mode=register",
  );

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
