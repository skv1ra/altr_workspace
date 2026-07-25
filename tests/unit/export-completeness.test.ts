// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const fromCalls: string[] = [];

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      fromCalls.push(table);
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => Promise.resolve({ data: [], error: null }),
      };
      return builder;
    },
  }),
}));

// eslint-disable-next-line import/first
import { buildUserExport, rowsToCsv } from "@/lib/privacy/export";

/**
 * Prompt 047 — no test anywhere exercised `buildUserExport`'s actual table
 * coverage before this file; only the HTTP layer (`GET /api/privacy/
 * export`, must-not-change) was indirectly touched by
 * `tests/components/ExportSection.test.tsx`, which mocks `fetch` and
 * never sees which tables the real export function reads. This asserts
 * the real, complete set — matching `docs/LEGAL_LAUNCH_CHECKLIST.md`'s
 * own claim (LEGACY-only, read in full in 046) that authenticated export
 * "may include profile, settings, consents, imports, conversations,
 * messages, AI memory, assistant configurations, drafts, feedback and
 * permitted billing metadata" — every category named there is checked
 * against the real function's actual queries below, not assumed from
 * that prose alone.
 */
describe("buildUserExport content completeness", () => {
  it("queries every real per-category table this app actually has user data in", async () => {
    fromCalls.length = 0;
    await buildUserExport({ id: "user-1", email: "user@example.com", created_at: "2026-01-01T00:00:00.000Z" });

    const expected = [
      "altr_profiles",
      "altr_user_preferences",
      "altr_consents",
      "altr_consent_history",
      "altr_consent_events",
      "altr_conversation_imports",
      "altr_conversations",
      "altr_messages",
      "altr_memories",
      "altr_memory_sources",
      "altr_assistant_configs",
      "altr_assistant_runs",
      "altr_draft_replies",
      "altr_draft_feedback",
      "altr_deletion_requests",
      "altr_subscriptions",
      "altr_invoices",
      "altr_billing_orders",
      "altr_billing_invoices",
    ];
    for (const table of expected) {
      expect(fromCalls, `${table} was never queried by buildUserExport`).toContain(table);
    }
  });

  it("separates billing metadata from the main per-category data object, exactly the four real billing tables", async () => {
    const result = await buildUserExport({ id: "user-1", email: "user@example.com" });
    expect(Object.keys(result.billingMetadata).sort()).toEqual(
      ["altr_billing_invoices", "altr_billing_orders", "altr_invoices", "altr_subscriptions"].sort(),
    );
    // Billing tables are not duplicated into the main `data` bucket.
    for (const billingTable of Object.keys(result.billingMetadata)) {
      expect(result.data[billingTable]).toBeUndefined();
    }
  });

  it("stamps the real requesting user's id/email, never a value that could be spoofed by export content itself", async () => {
    const result = await buildUserExport({ id: "user-42", email: "real@example.com", created_at: "2026-02-01T00:00:00.000Z" });
    expect(result.user).toEqual({ id: "user-42", email: "real@example.com", createdAt: "2026-02-01T00:00:00.000Z" });
    expect(result.schemaVersion).toBe("phase-8-v1");
  });
});

describe("rowsToCsv", () => {
  it("returns an empty string for zero rows, never a header-only or malformed CSV", () => {
    expect(rowsToCsv([])).toBe("");
  });

  it("escapes embedded quotes and unions all row keys as headers, even when rows have different shapes", () => {
    const csv = rowsToCsv([{ a: 'say "hi"', b: 1 }, { a: "plain", c: true }]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe('"a","b","c"');
    expect(lines[1]).toBe('"say ""hi""","1",""');
    expect(lines[2]).toBe('"plain","","true"');
  });
});
