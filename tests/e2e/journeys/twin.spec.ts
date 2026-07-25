import { test, expect } from "@playwright/test";
import { json, mockApi } from "../support";

/**
 * Twin journey (048) — config + draft + errors + history. `/assistants`
 * is inside `app/(app)/`, so it hits the same placeholder-Supabase SSR
 * block every `(app)` route has had since 029 (see `../support.ts`'s
 * `APP_GROUP_BLOCKED_PATHS`, reverified fresh for this prompt). Same
 * treatment as the memory journey: `test.describe.skip`, not deleted or
 * faked passing — real test bodies against the actual `TwinConfigView.
 * tsx`/`TwinDraftWorkspace.tsx` contract (selectors cross-checked against
 * `tests/components/{TwinConfigView,TwinDraftWorkspace}.test.tsx`'s own
 * already-passing RTL suites, response shapes read directly from
 * `app/api/assistants/[id]/route.ts` and `app/api/ai/draft-reply/
 * route.ts`), ready to enable once this environment has real Supabase
 * credentials. Real component-level coverage for config, draft
 * generation/edit/copy/regenerate/feedback, every error state, and
 * history already exists and passes today in `TwinConfigView.test.tsx`,
 * `TwinDraftWorkspace.test.tsx`, and `TwinDraftHistory.test.tsx`.
 */
test.describe.skip("twin journey (content-level e2e blocked — see file header; component coverage in TwinConfigView/TwinDraftWorkspace/TwinDraftHistory.test.tsx)", () => {
  test("config: updating the Twin's name and tone saves through the real PATCH endpoint", async ({ page }) => {
    const assistant = { id: "a1", name: "My Altr", assistant_type: "digital_twin", system_instructions: "Keep it short.", tone: "balanced", is_active: true, config: {}, created_at: "2026-07-01T00:00:00.000Z", updated_at: "2026-07-01T00:00:00.000Z" };
    await mockApi(page, (path, route) => {
      if (path === "/api/assistants" && route.request().method() === "GET") {
        return route.fulfill(json({ assistants: [assistant], previews: [] }));
      }
      if (path === "/api/assistants/a1" && route.request().method() === "PATCH") {
        expect(route.request().postDataJSON()).toMatchObject({ name: "Work Altr" });
        return route.fulfill(json({ assistant: { ...assistant, name: "Work Altr" } }));
      }
      return route.continue();
    });

    await page.goto("/assistants");
    await page.getByLabel(/Name/).fill("Work Altr");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByLabel(/Name/)).toHaveValue("Work Altr");
  });

  test("draft: generating a reply calls the real endpoint and renders the returned draft; a quota-reached response shows the designed upgrade link, never a raw error", async ({ page }) => {
    const assistant = { id: "a1", name: "My Altr", assistant_type: "digital_twin", system_instructions: "", tone: "balanced", is_active: true, config: {}, created_at: "2026-07-01T00:00:00.000Z", updated_at: "2026-07-01T00:00:00.000Z" };
    let draftCalls = 0;
    await mockApi(page, (path, route) => {
      if (path === "/api/assistants" && route.request().method() === "GET") {
        return route.fulfill(json({ assistants: [assistant], previews: [] }));
      }
      if (path === "/api/ai/draft-reply" && route.request().method() === "POST") {
        draftCalls += 1;
        if (draftCalls === 1) {
          return route.fulfill(json({ error: "AI_DRAFT_QUOTA_REACHED", limits: { aiDraftsPerMonth: 10 } }, 429));
        }
        return route.fulfill(json({ draft: "Thanks for reaching out — I'll confirm shortly.", usedMemoryIds: [], usedMessageIds: [], usedConversationIds: [], model: "gpt-5.6", assistantRunId: "run-1", status: "draft", quota: { used: 1, limit: 10 } }));
      }
      return route.continue();
    });

    await page.goto("/assistants");
    await page.getByLabel(/Incoming message/).fill("Can you confirm the price?");
    await page.getByRole("button", { name: "Generate draft" }).click();
    await expect(page.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute("href", "/pricing");

    await page.getByRole("button", { name: "Generate draft" }).click();
    await expect(page.getByText("Thanks for reaching out — I'll confirm shortly.")).toBeVisible();
  });

  test("history: the draft history list renders real past runs from the real endpoint", async ({ page }) => {
    await mockApi(page, (path, route) => {
      if (path === "/api/assistants" && route.request().method() === "GET") {
        return route.fulfill(json({ assistants: [], previews: [] }));
      }
      if (path === "/api/ai/drafts" && route.request().method() === "GET") {
        return route.fulfill(json({
          runs: [{ id: "run-1", input_text: "Can you confirm the price?", output_text: "Thanks — confirming shortly.", model: "gpt-5.6", status: "draft", used_memory_ids: [], used_message_ids: [], used_conversation_ids: [], request_metadata: {}, created_at: "2026-07-01T00:00:00.000Z", completed_at: "2026-07-01T00:00:05.000Z" }],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        }));
      }
      return route.continue();
    });

    await page.goto("/assistants");
    await expect(page.getByText("Can you confirm the price?")).toBeVisible();
  });
});
