import { test, expect } from "@playwright/test";
import { json, mockApi, seedCookieConsent } from "../support";

/**
 * Privacy journey (048) — consents, export trigger, deletion ceremony
 * gate. Split across two reachability classes, same as billing:
 * `/delete-data` and `/data-deletion` sit outside `app/(app)/` (043's own
 * precedent, established for these two specific pages in 045) and get
 * full content-level coverage below; the authenticated `/privacy-center`
 * hub itself (consents, export) is inside `(app)/` and hits the same
 * placeholder-Supabase SSR block documented in `../support.ts` — its own
 * `test.describe.skip` block at the bottom is real, written against
 * `ConsentsSection.test.tsx`/`ExportSection.test.tsx`/`PrivacyCenter.
 * test.tsx`'s own already-passing selectors, ready to enable once this
 * environment has real Supabase credentials.
 */
test.describe("privacy journey", () => {
  test("/data-deletion renders the real, must-not-change policy content", async ({ page }) => {
    await page.goto("/data-deletion");
    await expect(page.getByRole("heading", { name: "Data Deletion" })).toBeVisible();
    await expect(page.getByText("This page explains how to ask Altr to delete")).toBeVisible();
  });

  // Security-semantic pin: the public deletion-request form submits the
  // real, server-recorded contract — never a fake local-only success
  // state. Named clearly so it isn't casually deleted.
  test("SECURITY PIN — /delete-data: the public deletion-request form submits the real contract and shows a reference", async ({ page }) => {
    // A fresh profile shows the real global cookie banner (045) after
    // 350ms, fixed to the bottom of the viewport — on this specific
    // page, real content (this exact checkbox) sits low enough to be
    // physically covered by it until dismissed, confirmed directly
    // against a real run. Pre-seeding a stored preference is what a
    // returning visitor's browser would already have.
    await seedCookieConsent(page);
    await mockApi(page, (path, route) => {
      if (path === "/api/me") return route.fulfill(json({ profile: null }, 401));
      if (path === "/api/privacy/deletion-requests") {
        expect(route.request().postDataJSON()).toEqual({ email: "visitor@example.com", scope: "all", confirmed: true });
        return route.fulfill(json({ ok: true, reference: "DEL-E2E123" }, 202));
      }
      return route.continue();
    });
    await page.goto("/delete-data");

    await page.getByLabel(/^Email/).fill("visitor@example.com");
    await page.getByText("I confirm this request concerns my own data.").click();
    await page.getByRole("button", { name: "Submit request" }).click();

    await expect(page.getByText("Request recorded.")).toBeVisible();
    await expect(page.getByText("DEL-E2E123")).toBeVisible();
  });

  test("/delete-data: a signed-in visitor also sees the immediate-deletion entry point and real export download links", async ({ page }) => {
    await seedCookieConsent(page);
    await mockApi(page, (path, route) => {
      if (path === "/api/me") {
        return route.fulfill(
          json({
            profile: {
              id: "11111111-1111-4111-8111-111111111111",
              name: "Playwright User",
              email: "playwright@example.com",
              role: "Founder",
              altrName: "My Altr",
              bio: "",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              plan: "free",
              trainingProgress: 10,
              tone: "balanced",
              onboardingCompleted: true,
              stats: { conversations: 0, memories: 0, drafts: 0 },
              connections: { email: false, calendar: false, messages: false, workspace: false },
              preferences: { learning: true, autoDrafts: false, weeklyDigest: false, privacyMode: true },
              consents: { policyVersion: "draft-2026-07-15", termsAcceptedAt: "", conversationProcessingAcceptedAt: "", aiMemoryAcceptedAt: "" },
            },
          }),
        );
      }
      return route.continue();
    });
    await page.goto("/delete-data");

    await expect(page.getByText("Signed in as")).toBeVisible();
    await expect(page.getByRole("link", { name: "Export JSON" })).toHaveAttribute("href", "/api/privacy/export");
    await expect(page.getByRole("link", { name: "Export CSV ZIP" })).toHaveAttribute("href", "/api/privacy/export?format=csv");
    await expect(page.getByRole("button", { name: "Delete account" })).toBeVisible();
  });
});

test.describe.skip("privacy journey — /privacy-center (content-level e2e blocked — see file header; component coverage in ConsentsSection/ExportSection/PrivacyCenter.test.tsx)", () => {
  test("consents: withdrawing a granted consent calls the real endpoint and updates the shown state", async ({ page }) => {
    let withdrawn = false;
    await mockApi(page, (path, route) => {
      if (path === "/api/me") {
        return route.fulfill(json({
          profile: {
            id: "u1", name: "Test", email: "user@example.com", role: "Founder", altrName: "My Altr", bio: "",
            createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", plan: "free", trainingProgress: 10, tone: "balanced", onboardingCompleted: true,
            stats: { conversations: 0, memories: 0, drafts: 0 }, connections: { email: false, calendar: false, messages: false, workspace: false },
            preferences: { learning: true, autoDrafts: false, weeklyDigest: false, privacyMode: true },
            consents: { policyVersion: "v1", termsAcceptedAt: "2026-01-01T00:00:00.000Z", conversationProcessingAcceptedAt: withdrawn ? "" : "2026-01-01T00:00:00.000Z", aiMemoryAcceptedAt: "" },
          },
        }));
      }
      if (path === "/api/consents/withdraw") {
        withdrawn = true;
        return route.fulfill(json({ ok: true }));
      }
      return route.continue();
    });

    await page.goto("/privacy-center");
    await page.getByRole("button", { name: "Withdraw" }).first().click();
    await expect(page.getByText("Not granted").first()).toBeVisible();
  });

  test("export: triggering an export calls the real endpoint and shows a pending state", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/me") return route.fulfill(json({ profile: { id: "u1", consents: {} } }));
      if (path === "/api/privacy/export") return new Promise(() => undefined); // never resolves — pending state stays visible
      return route.continue();
    });

    await page.goto("/privacy-center");
    await page.getByRole("button", { name: /Export JSON/ }).click();
    await expect(page.getByText("Preparing your export…")).toBeVisible();
  });
});
