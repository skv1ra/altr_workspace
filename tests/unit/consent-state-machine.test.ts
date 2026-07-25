// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ requireUser: async () => ({ id: "user-1", email: "user@example.com" }) }));

type Call = { method: string; args: unknown[] };
const calls: Record<string, Call[]> = {};
let existingConsent: Record<string, unknown> | null = null;

function resetCalls() {
  for (const key of Object.keys(calls)) delete calls[key];
}

function makeBuilder(table: string) {
  const record = (method: string, args: unknown[]) => {
    calls[table] = calls[table] ?? [];
    calls[table].push({ method, args });
  };
  const resolveValue = () => (table === "altr_consents" ? { data: existingConsent, error: null } : { data: null, error: null });
  const builder: any = {
    select: (...args: unknown[]) => { record("select", args); return builder; },
    eq: (...args: unknown[]) => { record("eq", args); return builder; },
    order: (...args: unknown[]) => { record("order", args); return builder; },
    limit: (...args: unknown[]) => { record("limit", args); return builder; },
    update: (...args: unknown[]) => { record("update", args); return builder; },
    insert: (...args: unknown[]) => { record("insert", args); return builder; },
    single: () => Promise.resolve({ data: { id: "consent-1" }, error: null }),
    maybeSingle: () => Promise.resolve(resolveValue()),
    then: (resolve: (value: unknown) => void) => resolve(resolveValue()),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ from: (table: string) => makeBuilder(table) }),
}));

// eslint-disable-next-line import/first
import { POST as grant } from "@/app/api/consents/grant/route";
// eslint-disable-next-line import/first
import { POST as withdraw } from "@/app/api/consents/withdraw/route";

function requestFor(body: unknown) {
  return new NextRequest("https://altr.example/api/consents/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(() => {
  resetCalls();
  existingConsent = null;
});

/**
 * Prompt 047 — no test anywhere drove the real `POST /api/consents/
 * {grant,withdraw}` route handlers (must-not-change) directly; only the
 * UI layer (`ConsentsSection.test.tsx`, 045, mocked `fetch`) and static
 * assertions (`phase10-legal-consistency.test.ts`, 046) existed. This
 * exercises the actual state-machine logic with a mocked Supabase admin
 * client (same pattern as `webhook-handler-idempotency.test.ts`, 044).
 */
describe("consent state machine — POST /api/consents/grant", () => {
  it("rejects a request granting neither consent type, before touching the database", async () => {
    const response = await grant(requestFor({ conversationProcessing: false, aiMemory: false }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "NO_CONSENT_SELECTED" });
    expect(calls["altr_consents"]).toBeUndefined();
  });

  it("granting only conversationProcessing preserves an existing, separately-granted aiMemory acceptance untouched — the real state-machine property this test exists to prove", async () => {
    existingConsent = {
      id: "consent-1",
      terms_accepted_at: "2026-01-01T00:00:00.000Z",
      conversation_processing_accepted_at: null,
      ai_memory_accepted_at: "2026-01-02T00:00:00.000Z",
    };
    const response = await grant(requestFor({ conversationProcessing: true, aiMemory: false, locale: "en" }));
    expect(response.status).toBe(200);
    const update = calls["altr_consents"]?.find((call) => call.method === "update");
    const values = update?.args[0] as Record<string, unknown>;
    expect(values.conversation_processing_accepted_at).not.toBeNull();
    expect(values.ai_memory_accepted_at).toBe("2026-01-02T00:00:00.000Z");
  });

  it("records only the granted type(s) as consent events, not both unconditionally", async () => {
    existingConsent = null;
    await grant(requestFor({ conversationProcessing: true, aiMemory: false, locale: "en" }));
    const eventsInsert = calls["altr_consent_events"]?.find((call) => call.method === "insert");
    const rows = eventsInsert?.args[0] as Array<{ consent_type: string }>;
    expect(rows.map((row) => row.consent_type)).toEqual(["conversation_processing"]);
  });
});

describe("consent state machine — POST /api/consents/withdraw", () => {
  it("returns 404 when there is no consent record to withdraw from yet", async () => {
    existingConsent = null;
    const response = await withdraw(requestFor({ conversationProcessing: true, aiMemory: false }));
    expect(response.status).toBe(404);
  });

  it("withdrawing aiMemory nulls only that field, preserves conversationProcessing, and does NOT set withdrawn_at (one consent still active)", async () => {
    existingConsent = {
      id: "consent-1",
      policy_version: "v1",
      terms_accepted_at: "2026-01-01T00:00:00.000Z",
      conversation_processing_accepted_at: "2026-01-01T00:00:00.000Z",
      ai_memory_accepted_at: "2026-01-02T00:00:00.000Z",
      locale: "en",
      ip_address: null,
      user_agent: null,
    };
    const response = await withdraw(requestFor({ conversationProcessing: false, aiMemory: true }));
    expect(response.status).toBe(200);
    const update = calls["altr_consents"]?.find((call) => call.method === "update");
    const values = update?.args[0] as Record<string, unknown>;
    expect(values.ai_memory_accepted_at).toBeNull();
    expect(values.conversation_processing_accepted_at).toBe("2026-01-01T00:00:00.000Z");
    expect(values.withdrawn_at).toBeNull();
  });

  it("withdrawing both consents sets withdrawn_at — the real terminal state", async () => {
    existingConsent = {
      id: "consent-1",
      policy_version: "v1",
      terms_accepted_at: "2026-01-01T00:00:00.000Z",
      conversation_processing_accepted_at: "2026-01-01T00:00:00.000Z",
      ai_memory_accepted_at: "2026-01-02T00:00:00.000Z",
      locale: "en",
      ip_address: null,
      user_agent: null,
    };
    await withdraw(requestFor({ conversationProcessing: true, aiMemory: true }));
    const update = calls["altr_consents"]?.find((call) => call.method === "update");
    const values = update?.args[0] as Record<string, unknown>;
    expect(values.withdrawn_at).not.toBeNull();
  });

  it("withdrawing aiMemory also disables future memory learning — a real, cross-table consequence, not just a flag on the consent row", async () => {
    existingConsent = {
      id: "consent-1",
      policy_version: "v1",
      terms_accepted_at: "2026-01-01T00:00:00.000Z",
      conversation_processing_accepted_at: "2026-01-01T00:00:00.000Z",
      ai_memory_accepted_at: "2026-01-02T00:00:00.000Z",
      locale: "en",
      ip_address: null,
      user_agent: null,
    };
    await withdraw(requestFor({ conversationProcessing: false, aiMemory: true }));
    const preferencesUpdate = calls["altr_user_preferences"]?.find((call) => call.method === "update");
    expect(preferencesUpdate?.args[0]).toEqual({ memory_learning_enabled: false });
    expect(calls["altr_data_connections"]).toBeUndefined();
  });

  it("withdrawing conversationProcessing also disconnects data connections, and never touches memory preferences", async () => {
    existingConsent = {
      id: "consent-1",
      policy_version: "v1",
      terms_accepted_at: "2026-01-01T00:00:00.000Z",
      conversation_processing_accepted_at: "2026-01-01T00:00:00.000Z",
      ai_memory_accepted_at: "2026-01-02T00:00:00.000Z",
      locale: "en",
      ip_address: null,
      user_agent: null,
    };
    await withdraw(requestFor({ conversationProcessing: true, aiMemory: false }));
    const connectionsUpdate = calls["altr_data_connections"]?.find((call) => call.method === "update");
    expect(connectionsUpdate?.args[0]).toEqual({ status: "disconnected" });
    expect(calls["altr_user_preferences"]).toBeUndefined();
  });
});
