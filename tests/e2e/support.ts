import type { Page, Route } from "@playwright/test";

/**
 * Prompt 048 — extracted from what was duplicated inline across
 * `critical-flows.spec.ts` and (implicitly) `smoke.spec.ts`: the
 * lightweight `mockApi`/`json` helpers LEGACY's own e2e suite used, kept
 * in this shared file now that the suite is split across eight journey
 * files (039-047 kept them inline since only one spec file existed and
 * none of those prompts had `tests/e2e/**` restructuring in scope).
 */
export function json(body: unknown, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

export async function mockApi(page: Page, handler: (path: string, route: Route) => Promise<void> | void) {
  await page.route("**/*", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/api/")) return handler(path, route);
    await route.continue();
  });
}

/**
 * Every real `(app)/*` route (`/dashboard`, `/onboarding`, `/memory`,
 * `/assistants`, `/billing`, `/settings`, `/privacy-center`) is server-
 * rendered by `app/(app)/layout.tsx` (must-not-change), which
 * unconditionally calls `getProfileForUser()` against the *real*
 * configured Supabase URL — a placeholder in both local dev and CI
 * (`.github/workflows/ci.yml` sets `NEXT_PUBLIC_SUPABASE_URL: https://
 * ci-placeholder.supabase.co`) — before any client JS or `mockApi`
 * route-interception can run, since that call happens server-side
 * during the initial SSR response. This has been a confirmed, standing
 * gap since Prompt 029; re-verified fresh for this prompt by curling all
 * seven paths with the real mocked identity headers against a freshly
 * built-and-started production server — every one still returns `500`.
 * No amount of `page.route` mocking can reach past it; it is not a bug
 * this prompt (`tests/e2e/**` only) can fix. Real behavioral coverage
 * for what renders on those pages lives in their own RTL component
 * tests instead (`MemoryOverview.test.tsx`, `TwinConfigView.test.tsx`,
 * `TwinDraftWorkspace.test.tsx`, `BillingOverview.test.tsx`,
 * `PrivacyCenter.test.tsx`, `OnboardingFlow.test.tsx`, `DashboardHome
 * .test.tsx` — all real, all passing, all mocked at the `fetch` layer
 * instead of the SSR layer). The journeys below test everything that
 * *is* genuinely reachable for each of these areas: the anonymous-visitor
 * redirect gate, and (for billing/privacy specifically) the real
 * top-level pages that sit outside `(app)/` entirely (`/payment/*`,
 * `/delete-data`, `/data-deletion*`) and were never blocked by this.
 */
export const APP_GROUP_BLOCKED_PATHS = ["/dashboard", "/onboarding", "/memory", "/assistants", "/billing", "/settings", "/privacy-center"] as const;

/** What a returning visitor's browser already has stored — pre-seeding
 *  this keeps journeys unrelated to the cookie banner itself from
 *  needing to dismiss a `fixed`/bottom-of-viewport element that can
 *  otherwise physically cover real content on shorter pages (found in
 *  045/048 while testing `/delete-data`). */
export async function seedCookieConsent(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "altr_cookie_preferences_v1",
      JSON.stringify({
        necessary: true,
        functional: true,
        analytics: false,
        marketing: false,
        version: "e2e",
        timestamp: new Date().toISOString(),
        source: "banner",
      }),
    );
  });
}

export const IMPORT_LIMITS = {
  importsPerMonth: 1,
  maxFileBytes: 5_242_880,
  maxMessagesPerImport: 2000,
  maxConversationsPerImport: 100,
  maxActiveMemories: 250,
  aiDraftsPerMonth: 10,
  concurrentImports: 1,
  concurrentMemoryJobs: 1,
} as const;
