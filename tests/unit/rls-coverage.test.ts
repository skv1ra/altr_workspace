// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/tests/phase_3_rls_verification.sql", "utf8");

/**
 * The 26 `altr_` tables named in `docs/claude-prompts/MASTER_CONTEXT.md`'s
 * own "Database (26 tables)" list — the RLS SQL verification script
 * cannot itself run in CI (no live Supabase instance here), but this
 * cheap, durable source-level check at least pins that it still mentions
 * every real table, so a future edit can't silently drop coverage for
 * one without a test noticing.
 */
const ALL_TABLES = [
  "altr_profiles",
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
  "altr_subscriptions",
  "altr_invoices",
  "altr_billing_orders",
  "altr_billing_invoices",
  "altr_billing_webhook_events",
  "altr_usage_counters",
  "altr_user_preferences",
  "altr_deletion_requests",
  "altr_deletion_request_history",
  "altr_data_connections",
  "altr_audit_logs",
  "altr_audit_events",
  "altr_auth_rate_limits",
];

const SERVICE_ONLY_TABLES = ["altr_billing_webhook_events", "altr_audit_events", "altr_auth_rate_limits"];

describe("RLS SQL verification coverage (047)", () => {
  it("mentions every one of the 26 real altr_ tables from MASTER_CONTEXT.md", () => {
    const missing = ALL_TABLES.filter((table) => !sql.includes(table));
    expect(missing).toEqual([]);
  });

  it("keeps the deny-all service-only tables (webhook events, audit events, auth rate limits) in the section explicitly documented as service-only", () => {
    const marker = sql.indexOf("Service-only tables");
    expect(marker).toBeGreaterThan(-1);
    const serviceOnlySection = sql.slice(marker);
    for (const table of SERVICE_ONLY_TABLES) {
      expect(serviceOnlySection, `${table} should appear in the service-only section`).toContain(table);
    }
  });
});
