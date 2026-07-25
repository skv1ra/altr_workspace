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

  test("checkout creation sends only { planId } and navigates to the returned checkoutUrl (LEGACY's own contract, unchanged), landing on the real pending confirmation page (043)", async ({
    page,
  }) => {
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
    // 043's own real page — unlike every `(app)` page, this one isn't
    // wrapped in `AppShell`/the `(app)` layout, so it's genuinely
    // reachable here instead of 500ing on the placeholder-Supabase gap.
    await expect(page.getByText("Payment received. Confirming your plan…")).toBeVisible({ timeout: 10_000 });
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
 * Prompt 043 — checkout and payment returns. Unlike every `(app)` page
 * since 029, these surfaces are NOT wrapped in `AppShell`/the `(app)`
 * route group (same precedent `/import-conversations`, 032, already
 * set) — confirmed concretely, not assumed, by curling all four new
 * routes with the real mocked e2e identity during this prompt's own
 * manual verification: all returned 200 with real content, none hit the
 * placeholder-Supabase 500 every `(app)` page has had since 029. That
 * makes real, content-level e2e coverage possible here for the first
 * time since the memory/twin/billing phases began.
 */
test.describe("payment returns", () => {
  test("payment success page never upgrades the plan — it only ever reflects what the server's own hasPremium says, re-checked, never assumed", async ({
    page,
  }) => {
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

/*
 * Prompt 026 — recovery, reset, callback. `/api/auth/forgot-password`
 * (must-not-change) always replies with the same shape regardless of
 * whether the account exists — this is the one end-to-end proof that the
 * real route, not just the component in isolation, never discloses
 * account existence. Reset-password's own designed states (invalid/
 * expired link, success) are covered at the component level in
 * `tests/components/ResetPasswordForm.test.tsx` since reaching them for
 * real requires a live Supabase recovery session this harness's
 * `x-altr-e2e-user` mock doesn't model.
 */
test.describe("password recovery", () => {
  test("forgot-password shows the identical neutral confirmation for both an existing and a non-existent account, with no dead click required to prove it", async ({
    page,
  }) => {
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
});

/*
 * Prompt 027 — protected routes and sign-out. None of these seven pages
 * (`lib/supabase/middleware.ts`'s own `pages` list, must-not-change) have
 * an `app/**\/page.tsx` in this workspace yet — dashboard is 029, memory is
 * 036, assistants/twin config is 039, imports is 032, billing is 042,
 * legacy-migration and payment/success have no prompt of their own yet
 * either. Middleware runs before route resolution though, so the redirect
 * contract is real and verifiable right now regardless of page existence —
 * confirmed live via curl against a real `yarn build && yarn start` server
 * during this prompt's own manual verification (see STATUS.md's 027 entry
 * for the full table with response bodies/sizes), and re-asserted here as
 * a standing regression test so a future prompt can't silently narrow the
 * protected-page list without a test failing.
 *
 * `SignOutButton` has no page mounting it yet for the same reason (no
 * dashboard to hold it — LEGACY's own equivalent lived inside
 * `app/dashboard/page.tsx`, Prompt 029's scope), so there is no click-
 * through UI path to drive here. What *is* real and live right now is the
 * `/api/auth/logout` contract itself (unmodified) that `SignOutButton`
 * calls via `signOutAccount()` — exercised directly via Playwright's
 * `request` fixture rather than faking a page to click a button on.
 */
test.describe("protected routes and sign-out", () => {
  for (const path of ["/dashboard", "/memory", "/assistants", "/import-conversations", "/billing", "/payment/success", "/legacy-migration"]) {
    test(`${path} redirects an anonymous visitor to /auth?mode=login&next=<path>, preserving the exact path`, async ({ browser, baseURL }) => {
      // Same "anonymous" override as the existing dashboard-only test
      // above: the global config's default `x-altr-e2e-user` is a real
      // UUID (signed in, for the other describes' own needs), and this
      // literal string fails `getE2EIdentity()`'s UUID check, correctly
      // simulating a logged-out visitor instead.
      const context = await browser.newContext({
        extraHTTPHeaders: { "x-altr-e2e-user": "anonymous", "x-altr-e2e-email": "anonymous@example.com" },
      });
      const page = await context.newPage();
      await page.goto(`${baseURL}${path}`);
      await expect(page).toHaveURL(new RegExp(`/auth\\?mode=login&next=${encodeURIComponent(path)}$`));
      await context.close();
    });
  }

  test("the real /api/auth/logout contract returns { ok: true }, the exact shape signOutAccount()/SignOutButton depend on", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/logout");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

/*
 * Prompt 032 — import experience. Ported from LEGACY's own "imports a
 * small local fixture with mocked persistence" e2e test (pinned `a22927d`)
 * — same fixture (`tests/fixtures/imports/telegram.json`), same mocked
 * `/api/imports`+`/chunks`+`/extract` contract, same final assertion text
 * (preserved verbatim in `ImportFlow.tsx`'s own status copy) — only the
 * selectors changed for the new UI. Unlike the dashboard/settings/
 * onboarding pages (029-031), `/import-conversations` has no server-side
 * data fetch of its own (`app/import-conversations/page.tsx` never calls
 * `requireUser()`/`getProfileForUser()` — all data comes from the client-
 * side `/api/imports` GET, exactly like LEGACY's own page), so this test
 * isn't blocked by the placeholder-Supabase environment gap 029 found —
 * real, full content-level e2e coverage is possible here.
 *
 * The consent checkbox is clicked via its label text rather than
 * `getByRole("checkbox")` directly: manual verification against a real
 * `yarn build && yarn start` server found the shared `Checkbox` primitive's
 * real (but `sr-only`) `<input>` is flaky for Playwright's own
 * actionability checks specifically (works fine for a real user, and for
 * RTL/jsdom) — clicking the associated `<label>` text is a standard,
 * equally-valid way to toggle a native checkbox and sidesteps it
 * entirely, without needing to touch `Checkbox.tsx` (out of this prompt's
 * own file scope regardless).
 */
test.describe("import experience", () => {
  test("imports the telegram fixture through the real UI: consent, provider selection, drop, chunked upload, and memory extraction all the way to done", async ({
    page,
  }) => {
    const limits = {
      importsPerMonth: 1,
      maxFileBytes: 5_242_880,
      maxMessagesPerImport: 2000,
      maxConversationsPerImport: 100,
      maxActiveMemories: 250,
      aiDraftsPerMonth: 10,
      concurrentImports: 1,
      concurrentMemoryJobs: 1,
    };
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits }));
      }
      if (path === "/api/imports" && route.request().method() === "POST") {
        return route.fulfill(json({ import: { id: "22222222-2222-4222-8222-222222222222" }, planId: "free" }, 201));
      }
      if (path.endsWith("/chunks")) return route.fulfill(json({ ok: true }));
      if (path.endsWith("/extract")) return route.fulfill(json({ done: true }));
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText(/free/)).toBeVisible({ timeout: 10_000 });

    // Telegram is the default provider and has its own bespoke guidance —
    // confirms the editorial provider list and per-provider steps render.
    await expect(page.getByRole("radio", { name: /Telegram/ })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText('Choose "Export chat history."')).toBeVisible();

    await page.getByText("I authorize storage of normalized results.", { exact: false }).click();
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/imports/telegram.json");

    await expect(page.getByText("Import and memory extraction complete", { exact: false })).toBeVisible({ timeout: 20_000 });
  });

  /*
   * Prompt 035 — closing Phase 7. `tests/fixtures/imports/telegram-export.zip`
   * is a new, synthetic fixture: `tests/fixtures/imports/telegram.json`
   * (the existing, already-committed fixture) zipped as
   * `ChatExport/result.json` via `jszip` (already a project dependency),
   * generated by a throwaway script and verified against the real
   * `parseImport()` pipeline before being committed — no real user data,
   * same fictional content as the source fixture. It closes a real,
   * previously-uncovered gap: `lib/imports/zip.ts`'s ZIP handling
   * (`inspectZip`/`extractSafeZipEntries`) was already unit-tested
   * directly in Node against in-memory-generated archives
   * (`tests/unit/import-parsers.test.ts`), but no test had ever driven a
   * real `.zip` through the actual browser `Worker` + file-input + hash +
   * chunk-upload pipeline — a materially different runtime (the worker's
   * own `JSZip.loadAsync` call, inside an actual Worker context) than the
   * Node-side unit tests exercise.
   */
  test("imports a real .zip export through the real UI — the browser Worker's own JSZip path, not just the Node-side unit tests", async ({
    page,
  }) => {
    const limits = {
      importsPerMonth: 1,
      maxFileBytes: 5_242_880,
      maxMessagesPerImport: 2000,
      maxConversationsPerImport: 100,
      maxActiveMemories: 250,
      aiDraftsPerMonth: 10,
      concurrentImports: 1,
      concurrentMemoryJobs: 1,
    };
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits }));
      }
      if (path === "/api/imports" && route.request().method() === "POST") {
        return route.fulfill(json({ import: { id: "99999999-9999-4999-8999-999999999999" }, planId: "free" }, 201));
      }
      if (path.endsWith("/chunks")) return route.fulfill(json({ ok: true }));
      if (path.endsWith("/extract")) return route.fulfill(json({ done: true }));
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText(/free/)).toBeVisible({ timeout: 10_000 });
    await page.getByText("I authorize storage of normalized results.", { exact: false }).click();
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/imports/telegram-export.zip");

    await expect(page.getByText("Import and memory extraction complete", { exact: false })).toBeVisible({ timeout: 20_000 });
  });

  test("consent gating: selecting a file without checking consent shows the designed rejection and never calls the create endpoint", async ({
    page,
  }) => {
    let createCalled = false;
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(
          json({
            imports: [],
            planId: "free",
            limits: { importsPerMonth: 1, maxFileBytes: 5_242_880, maxMessagesPerImport: 2000, maxConversationsPerImport: 100, maxActiveMemories: 250, aiDraftsPerMonth: 10, concurrentImports: 1, concurrentMemoryJobs: 1 },
          }),
        );
      }
      if (path === "/api/imports" && route.request().method() === "POST") {
        createCalled = true;
        return route.fulfill(json({ import: { id: "22222222-2222-4222-8222-222222222222" }, planId: "free" }, 201));
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText(/free/)).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/imports/telegram.json");

    await expect(page.locator('p[role="alert"]')).toContainText("Confirm that normalized data may be stored.");
    expect(createCalled).toBe(false);
  });

  /*
   * Prompt 033 — import progress, cancel, retry. Real, live evidence (not
   * an RTL mock) that clicking Cancel during the "Saving" stage actually
   * aborts the in-flight chunk upload, rather than just hiding the UI:
   * the `/chunks` route handler is deliberately left pending (never
   * fulfilled) so the request only ever resolves by being aborted
   * client-side; the assertion is that no second chunk POST is ever sent
   * after cancel, and that the real DELETE cleanup contract fires
   * (`app/api/imports/[id]/route.ts`'s own policy: "normalized
   * conversations/messages deleted").
   */
  test("cancel actually aborts the chunk-upload stage — no further chunk requests after cancel, and the partial import is deleted", async ({
    page,
  }) => {
    const limits = {
      importsPerMonth: 5,
      maxFileBytes: 5_242_880,
      maxMessagesPerImport: 2000,
      maxConversationsPerImport: 100,
      maxActiveMemories: 250,
      aiDraftsPerMonth: 10,
      concurrentImports: 1,
      concurrentMemoryJobs: 1,
    };
    let chunkCalls = 0;
    let deleteCalled = false;
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits }));
      }
      if (path === "/api/imports" && route.request().method() === "POST") {
        return route.fulfill(json({ import: { id: "33333333-3333-4333-8333-333333333333" }, planId: "free" }, 201));
      }
      if (path.endsWith("/chunks")) {
        chunkCalls += 1;
        return new Promise(() => undefined); // never resolves — only settles by client-side abort
      }
      if (/^\/api\/imports\/[^/]+$/.test(path) && route.request().method() === "DELETE") {
        deleteCalled = true;
        return route.fulfill(json({ ok: true }));
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText(/free/)).toBeVisible({ timeout: 10_000 });
    await page.getByText("I authorize storage of normalized results.", { exact: false }).click();
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/imports/telegram.json");

    await expect.poll(() => chunkCalls, { timeout: 10_000 }).toBeGreaterThan(0);
    await page.getByRole("button", { name: /Cancel local parsing/ }).click();

    await expect(page.getByText("Import cancelled", { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => deleteCalled).toBe(true);
    expect(chunkCalls).toBe(1); // no zombie retries/duplicates after abort
    await expect(page.getByRole("button", { name: /Retry safely/ })).toBeVisible();
  });

  test("duplicate 409 renders the designed resolution panel — existing import's real status/date, a dashboard link, never a raw error", async ({
    page,
  }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(
          json({
            imports: [],
            planId: "free",
            limits: { importsPerMonth: 1, maxFileBytes: 5_242_880, maxMessagesPerImport: 2000, maxConversationsPerImport: 100, maxActiveMemories: 250, aiDraftsPerMonth: 10, concurrentImports: 1, concurrentMemoryJobs: 1 },
          }),
        );
      }
      if (path === "/api/imports" && route.request().method() === "POST") {
        return route.fulfill(
          json(
            {
              error: "DUPLICATE_IMPORT",
              import: { id: "44444444-4444-4444-8444-444444444444", status: "completed", created_at: "2026-07-20T10:00:00.000Z" },
            },
            409,
          ),
        );
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText(/free/)).toBeVisible({ timeout: 10_000 });
    await page.getByText("I authorize storage of normalized results.", { exact: false }).click();
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/imports/telegram.json");

    await expect(page.getByText("This file was already imported")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Completed/)).toBeVisible();
    await expect(page.getByRole("link", { name: "View status in history" })).toHaveAttribute("href", "/import-conversations#import-history");
    await expect(page.getByText("DUPLICATE_IMPORT")).toHaveCount(0);
  });

  test("monthly import quota reached (429) flips the existing QuotaMeter into its reached state with an upgrade link, not a raw error", async ({
    page,
  }) => {
    const limits = {
      importsPerMonth: 1,
      maxFileBytes: 5_242_880,
      maxMessagesPerImport: 2000,
      maxConversationsPerImport: 100,
      maxActiveMemories: 250,
      aiDraftsPerMonth: 10,
      concurrentImports: 1,
      concurrentMemoryJobs: 1,
    };
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits }));
      }
      if (path === "/api/imports" && route.request().method() === "POST") {
        return route.fulfill(json({ error: "IMPORT_MONTHLY_QUOTA_REACHED", limits }, 429));
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText(/free/)).toBeVisible({ timeout: 10_000 });
    await page.getByText("I authorize storage of normalized results.", { exact: false }).click();
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/imports/telegram.json");

    await expect(page.getByText("You've reached your monthly import limit.")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute("href", "/pricing");
  });

  test("extraction pause (monthly memory limit) offers a retry that resumes via the extract endpoint's cursor, never re-uploading", async ({
    page,
  }) => {
    const limits = {
      importsPerMonth: 5,
      maxFileBytes: 5_242_880,
      maxMessagesPerImport: 2000,
      maxConversationsPerImport: 100,
      maxActiveMemories: 250,
      aiDraftsPerMonth: 10,
      concurrentImports: 1,
      concurrentMemoryJobs: 1,
    };
    let createCalls = 0;
    let chunkCalls = 0;
    let extractCalls = 0;
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits }));
      }
      if (path === "/api/imports" && route.request().method() === "POST") {
        createCalls += 1;
        return route.fulfill(json({ import: { id: "55555555-5555-4555-8555-555555555555" }, planId: "free" }, 201));
      }
      if (path.endsWith("/chunks")) {
        chunkCalls += 1;
        return route.fulfill(json({ ok: true }));
      }
      if (path.endsWith("/extract")) {
        extractCalls += 1;
        if (extractCalls === 1) return route.fulfill(json({ error: "MEMORY_LIMIT_REACHED" }, 429));
        return route.fulfill(json({ done: true, created: 3 }));
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText(/free/)).toBeVisible({ timeout: 10_000 });
    await page.getByText("I authorize storage of normalized results.", { exact: false }).click();
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/imports/telegram.json");

    await expect(page.getByText("Extraction paused: you've reached your monthly memory limit.", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
    // Prompt 038's own "extraction-quota outcomes link here with consistent
    // copy" instruction — `ImportFlow.tsx` renders this link only for the
    // `MEMORY_LIMIT_REACHED` reason (never for the sibling
    // `MEMORY_PROCESSING_CONCURRENCY_LIMIT` reason), reusing the exact same
    // shared `quota.upgradeLink` copy/`/pricing` href as `QuotaMeter`'s own
    // reached state — this was previously exercised only by the sibling
    // "monthly import quota" test above, never for the memory-limit reason
    // specifically, until this prompt.
    await expect(page.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute("href", "/pricing");
    await page.getByRole("button", { name: "Retry memory extraction" }).click();
    await expect(page.getByText(/3 memories saved\./)).toBeVisible({ timeout: 10_000 });

    expect(createCalls).toBe(1);
    expect(chunkCalls).toBe(1);
    expect(extractCalls).toBe(2);
  });
});

/*
 * Prompt 034 — import history and errors. Real, live coverage of the new
 * `ImportHistory` section on the same page: an empty-history invitation,
 * a real row with expandable provenance detail showing taxonomy-mapped
 * (never raw-code) error text, a real DELETE call that removes the row
 * from the list, and a real cursor-based resume-extraction call.
 */
test.describe("import history", () => {
  const limits = {
    importsPerMonth: 5,
    maxFileBytes: 5_242_880,
    maxMessagesPerImport: 2000,
    maxConversationsPerImport: 100,
    maxActiveMemories: 250,
    aiDraftsPerMonth: 10,
    concurrentImports: 1,
    concurrentMemoryJobs: 1,
  };

  test("empty history shows the designed first-run invitation, not a blank area", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits }));
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText("Nothing imported yet")).toBeVisible({ timeout: 10_000 });
  });

  test("a completed row expands to real provenance detail; a failed row shows the taxonomy-mapped message, never the raw STALE_PROCESSING_IMPORT code", async ({
    page,
  }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(
          json({
            imports: [
              {
                id: "66666666-6666-4666-8666-666666666666",
                platform: "telegram",
                source_name: "chat-export.json",
                bytes: 204_800,
                status: "completed",
                conversations: 3,
                messages: 42,
                preview: [],
                parser_version: "altr-browser-parser-2",
                mime_type: "application/json",
                file_extension: "json",
                raw_file_stored: false,
                created_at: "2026-07-20T10:00:00.000Z",
                completed_at: "2026-07-20T10:01:00.000Z",
                error: null,
                extraction_status: "completed",
                extraction_error: null,
                extraction_cursor: 42,
              },
              {
                id: "77777777-7777-4777-8777-777777777777",
                platform: "gmail",
                source_name: "old-attempt.mbox",
                bytes: 10_240,
                status: "failed",
                conversations: 0,
                messages: 0,
                preview: [],
                parser_version: "altr-browser-parser-2",
                mime_type: "application/mbox",
                file_extension: "mbox",
                raw_file_stored: false,
                created_at: "2026-07-19T09:00:00.000Z",
                completed_at: null,
                error: "STALE_PROCESSING_IMPORT",
                extraction_status: "pending",
                extraction_error: null,
                extraction_cursor: 0,
              },
            ],
            planId: "free",
            limits,
          }),
        );
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText("chat-export.json")).toBeVisible({ timeout: 10_000 });

    const completedRow = page.locator("li", { hasText: "chat-export.json" });
    await completedRow.getByRole("button", { name: "View details" }).click();
    await expect(completedRow.getByText("altr-browser-parser-2")).toBeVisible();

    const failedRow = page.locator("li", { hasText: "old-attempt.mbox" });
    await failedRow.getByRole("button", { name: "View details" }).click();
    await expect(failedRow.getByText(/interrupted and never finished/)).toBeVisible();
    await expect(failedRow.getByText("STALE_PROCESSING_IMPORT")).toHaveCount(0);
  });

  test("delete calls the real DELETE endpoint and removes the row from the list", async ({ page }) => {
    let deleteCalled = false;
    let listed = true;
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(
          json({
            imports: listed
              ? [
                  {
                    id: "88888888-8888-4888-8888-888888888888",
                    platform: "telegram",
                    source_name: "delete-me.json",
                    bytes: 1024,
                    status: "completed",
                    conversations: 1,
                    messages: 1,
                    preview: [],
                    parser_version: "altr-browser-parser-2",
                    mime_type: "application/json",
                    file_extension: "json",
                    raw_file_stored: false,
                    created_at: "2026-07-20T10:00:00.000Z",
                    completed_at: "2026-07-20T10:01:00.000Z",
                    error: null,
                    extraction_status: "completed",
                    extraction_error: null,
                    extraction_cursor: 1,
                  },
                ]
              : [],
            planId: "free",
            limits,
          }),
        );
      }
      if (/^\/api\/imports\/[^/]+$/.test(path) && route.request().method() === "DELETE") {
        deleteCalled = true;
        listed = false;
        return route.fulfill(json({ ok: true }));
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText("delete-me.json")).toBeVisible({ timeout: 10_000 });

    const row = page.locator("li", { hasText: "delete-me.json" });
    await row.getByRole("button", { name: "View details" }).click();
    await row.getByRole("button", { name: /Delete/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("delete-me.json")).toHaveCount(0, { timeout: 10_000 });
    expect(deleteCalled).toBe(true);
  });
});

/*
 * Prompt 045 — privacy center. `/privacy-center` itself (the new
 * authenticated hub) is inside `(app)/`, so — like `/billing`, `/memory`,
 * `/assistants`, and `/settings` before it — it hits the same
 * placeholder-Supabase `getProfileForUser()` 500 this workspace has had
 * since 029, confirmed directly against a freshly built-and-started
 * production server with the real mocked identity headers before writing
 * this comment (curl, not assumed). No content-level e2e test is added
 * for it here, matching the same precedent already set for `/settings`
 * (never given one either, for the identical reason). `/delete-data` and
 * `/data-deletion` are real top-level routes outside `(app)/`, so —
 * matching 043's own precedent for `/payment/success` etc. — they *are*
 * genuinely reachable and get real content-level coverage below.
 */
test.describe("privacy center", () => {
  test("/data-deletion renders the real, must-not-change policy content", async ({ page }) => {
    await page.goto("/data-deletion");
    await expect(page.getByRole("heading", { name: "Data Deletion" })).toBeVisible();
    await expect(page.getByText("This page explains how to ask Altr to delete")).toBeVisible();
  });

  test("/delete-data: the public deletion-request form submits the real contract and shows a reference", async ({ page }) => {
    // A fresh profile shows the real global cookie banner (045) after
    // 350ms, fixed to the bottom of the viewport — on this specific
    // page, real content (this exact checkbox) sits low enough to be
    // physically covered by it until dismissed, confirmed directly
    // against a real run before adding this. Pre-seeding a stored
    // preference (functional accepted, same shape `CookieConsent`
    // itself writes) is what a returning visitor's browser would
    // already have, and keeps this test focused on the deletion-request
    // contract rather than banner dismissal.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "altr_cookie_preferences_v1",
        JSON.stringify({ necessary: true, functional: true, analytics: false, marketing: false, version: "e2e", timestamp: new Date().toISOString(), source: "banner" }),
      );
    });
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
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "altr_cookie_preferences_v1",
        JSON.stringify({ necessary: true, functional: true, analytics: false, marketing: false, version: "e2e", timestamp: new Date().toISOString(), source: "banner" }),
      );
    });
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
