// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/api/privacy/account/route.ts", "utf8");

/**
 * Prompt 047 — no test anywhere verified the real deletion *ordering* in
 * `DELETE /api/privacy/account` (must-not-change, read in full during
 * 045); only its overall behavior (contract, error codes) was covered.
 * The order matters for two independent reasons this test pins
 * separately: (1) storage/database must be cleared before the Supabase
 * Auth user itself is deleted, since a mid-failure after the Auth user
 * is gone would strand orphaned rows with no way to retry cleanly under
 * that user's own session; (2) within the database pass, child rows
 * must be deleted before the parent rows they reference, for real FK
 * relationships this schema actually has (verified against `supabase/
 * migrations/**`, not assumed from naming alone).
 */
describe("account deletion ordering (DELETE /api/privacy/account)", () => {
  function indexOf(needle: string) {
    const index = source.indexOf(needle);
    expect(index, `expected to find: ${needle}`).toBeGreaterThanOrEqual(0);
    return index;
  }

  it("clears private storage and database rows before deleting the Supabase Auth user, then finalizes only after that succeeds", () => {
    const storage = indexOf("await deletePrivateStorage(admin, user.id)");
    const database = indexOf("await prepareDatabaseDeletion(admin, user.id");
    const authDelete = indexOf("admin.auth.admin.deleteUser(user.id)");
    const finalize = indexOf("await finalizeDeletion(admin,");
    expect(storage).toBeLessThan(database);
    expect(database).toBeLessThan(authDelete);
    expect(authDelete).toBeLessThan(finalize);
  });

  it("deletes real child rows before the parent rows they reference (FK-safe order, not alphabetical or arbitrary)", () => {
    const orderBlock = source.slice(source.indexOf("const deletionOrder = ["), source.indexOf("];", source.indexOf("const deletionOrder = [")));
    const positionOf = (table: string) => {
      const position = orderBlock.indexOf(`"${table}"`);
      expect(position, `${table} missing from deletionOrder`).toBeGreaterThanOrEqual(0);
      return position;
    };
    // altr_draft_feedback references altr_draft_replies and
    // altr_assistant_runs — must go first.
    expect(positionOf("altr_draft_feedback")).toBeLessThan(positionOf("altr_draft_replies"));
    expect(positionOf("altr_draft_feedback")).toBeLessThan(positionOf("altr_assistant_runs"));
    // altr_memory_sources references altr_memories — must go first.
    expect(positionOf("altr_memory_sources")).toBeLessThan(positionOf("altr_memories"));
    // altr_messages references altr_conversations — must go first.
    expect(positionOf("altr_messages")).toBeLessThan(positionOf("altr_conversations"));
    // altr_profiles is a near-root reference for several of the above —
    // must go last among the deletionOrder's own rows, not first.
    expect(positionOf("altr_profiles")).toBeGreaterThan(positionOf("altr_conversations"));
  });

  it("anonymizes billing tables (never hard-deletes them) and keeps them out of the hard-delete deletionOrder list entirely", () => {
    const orderBlock = source.slice(source.indexOf("const deletionOrder = ["), source.indexOf("];", source.indexOf("const deletionOrder = [")));
    for (const billingTable of ["altr_subscriptions", "altr_invoices", "altr_billing_orders", "altr_billing_invoices"]) {
      expect(orderBlock, `${billingTable} must be anonymized, not hard-deleted`).not.toContain(billingTable);
    }
    expect(source).toContain("ANONYMIZE_SUBSCRIPTIONS_FAILED");
    expect(source).toContain("ANONYMIZE_ORDERS_FAILED");
  });
});
