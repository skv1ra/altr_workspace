import { test, expect } from "@playwright/test";
import { IMPORT_LIMITS, json, mockApi } from "../support";

/**
 * Import journey (048) — consolidates `critical-flows.spec.ts`'s own
 * `import experience` (032/033/035/038) and `import history` (034)
 * describes into one file, organized around the actual user path: pick
 * a file, watch it import, see it show up in history. Unlike the
 * `(app)` group, `/import-conversations` has no server-side data fetch
 * of its own (`app/import-conversations/page.tsx` never calls
 * `requireUser()`/`getProfileForUser()` — deliberately kept outside
 * `AppShell`, see that page's own comment) — real, full content-level
 * e2e coverage has always been possible here, unaffected by the
 * placeholder-Supabase gap documented in `../support.ts`.
 *
 * The consent checkbox is clicked via its label text rather than
 * `getByRole("checkbox")` directly: manual verification against a real
 * `yarn build && yarn start` server found the shared `Checkbox`
 * primitive's real (but `sr-only`) `<input>` is flaky for Playwright's
 * own actionability checks specifically — clicking the associated
 * `<label>` text is a standard, equally-valid way to toggle a native
 * checkbox and sidesteps it without touching `Checkbox.tsx`.
 */
test.describe("import journey", () => {
  test("imports the telegram fixture through the real UI: consent, provider selection, drop, chunked upload, and memory extraction all the way to done", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits: IMPORT_LIMITS }));
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

  test("imports a real .zip export through the real UI — the browser Worker's own JSZip path, not just the Node-side unit tests", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits: IMPORT_LIMITS }));
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

  test("consent gating: selecting a file without checking consent shows the designed rejection and never calls the create endpoint", async ({ page }) => {
    let createCalled = false;
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits: IMPORT_LIMITS }));
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

  test("cancel actually aborts the chunk-upload stage — no further chunk requests after cancel, and the partial import is deleted", async ({ page }) => {
    const limits = { ...IMPORT_LIMITS, importsPerMonth: 5 };
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

  test("duplicate 409 renders the designed resolution panel — existing import's real status/date, a dashboard link, never a raw error", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits: IMPORT_LIMITS }));
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

  test("monthly import quota reached (429) flips the existing QuotaMeter into its reached state with an upgrade link, not a raw error", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits: IMPORT_LIMITS }));
      }
      if (path === "/api/imports" && route.request().method() === "POST") {
        return route.fulfill(json({ error: "IMPORT_MONTHLY_QUOTA_REACHED", limits: IMPORT_LIMITS }, 429));
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

  test("extraction pause (monthly memory limit) offers a retry that resumes via the extract endpoint's cursor, never re-uploading", async ({ page }) => {
    const limits = { ...IMPORT_LIMITS, importsPerMonth: 5 };
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

    await expect(page.getByText("Extraction paused: you've reached your monthly memory limit.", { exact: false })).toBeVisible({ timeout: 15_000 });
    // 038's own "extraction-quota outcomes link here with consistent
    // copy" instruction — `ImportFlow.tsx` renders this link only for the
    // `MEMORY_LIMIT_REACHED` reason, reusing the exact same shared
    // `quota.upgradeLink` copy/`/pricing` href as `QuotaMeter`'s own
    // reached state.
    await expect(page.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute("href", "/pricing");
    await page.getByRole("button", { name: "Retry memory extraction" }).click();
    await expect(page.getByText(/3 memories saved\./)).toBeVisible({ timeout: 10_000 });

    expect(createCalls).toBe(1);
    expect(chunkCalls).toBe(1);
    expect(extractCalls).toBe(2);
  });

  test("empty history shows the designed first-run invitation, not a blank area", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/imports" && route.request().method() === "GET") {
        return route.fulfill(json({ imports: [], planId: "free", limits: { ...IMPORT_LIMITS, importsPerMonth: 5 } }));
      }
      return route.continue();
    });

    await page.goto("/import-conversations");
    await expect(page.getByText("Nothing imported yet")).toBeVisible({ timeout: 10_000 });
  });

  test("a completed row expands to real provenance detail; a failed row shows the taxonomy-mapped message, never the raw STALE_PROCESSING_IMPORT code", async ({ page }) => {
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
            limits: { ...IMPORT_LIMITS, importsPerMonth: 5 },
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
            limits: { ...IMPORT_LIMITS, importsPerMonth: 5 },
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
