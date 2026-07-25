// @vitest-environment node
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Call = { method: string; args: unknown[] };
const calls: Record<string, Call[]> = {};
let webhookEventsExisting: { id: string; processing_status: string; attempt_count: number } | null = null;

function resetCalls() {
  for (const key of Object.keys(calls)) delete calls[key];
}

function makeBuilder(table: string) {
  const record = (method: string, args: unknown[]) => {
    calls[table] = calls[table] ?? [];
    calls[table].push({ method, args });
  };
  const resolveValue = () => (table === "altr_billing_webhook_events" ? { data: webhookEventsExisting, error: null } : { data: null, error: null });
  const builder = {
    select: (...args: unknown[]) => {
      record("select", args);
      return builder;
    },
    eq: (...args: unknown[]) => {
      record("eq", args);
      return builder;
    },
    order: (...args: unknown[]) => {
      record("order", args);
      return builder;
    },
    limit: (...args: unknown[]) => {
      record("limit", args);
      return builder;
    },
    update: (...args: unknown[]) => {
      record("update", args);
      return builder;
    },
    insert: (...args: unknown[]) => {
      record("insert", args);
      return builder;
    },
    upsert: (...args: unknown[]) => {
      record("upsert", args);
      return builder;
    },
    maybeSingle: () => Promise.resolve(resolveValue()),
    then: (resolve: (value: unknown) => void) => resolve(resolveValue()),
  };
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({ from: (table: string) => makeBuilder(table) }),
}));

// eslint-disable-next-line import/first
import { handleLemonWebhook } from "@/lib/billing/webhook-handler";

const env = {
  NEXT_PUBLIC_APP_URL: "https://altr.example",
  LEMONSQUEEZY_API_KEY: "test-lemon-key-at-least-20-characters",
  LEMONSQUEEZY_STORE_ID: "42",
  LEMONSQUEEZY_WEBHOOK_SECRET: "test-webhook-secret-at-least-20-characters",
  LEMONSQUEEZY_PERSONAL_VARIANT_ID: "1001",
  LEMONSQUEEZY_WORK_VARIANT_ID: "1002",
};

function orderCreatedPayload() {
  return JSON.stringify({
    meta: { event_name: "order_created", custom_data: { user_id: "00000000-0000-4000-8000-000000000001" } },
    data: {
      type: "orders",
      id: "order_1",
      attributes: {
        store_id: 42,
        variant_id: 1001,
        status: "paid",
        total: 2000,
        currency: "USD",
        created_at: "2026-01-01T00:00:00.000Z",
        urls: { receipt: "https://app.lemonsqueezy.com/my-orders/receipt-1" },
      },
    },
  });
}

function sign(body: string) {
  return createHmac("sha256", env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest("hex");
}

function requestFor(body: string, signature: string | null) {
  return new NextRequest("https://altr.example/api/webhooks/lemonsqueezy", {
    method: "POST",
    body,
    headers: signature ? { "x-signature": signature } : {},
  });
}

/**
 * Prompt 044's own security requirement: "webhook signature and
 * idempotency tests must remain exactly as strict; any accidental
 * weakening found = restore + record." No existing test anywhere in this
 * workspace actually drove `handleLemonWebhook`'s own idempotency
 * mechanism (the `altr_billing_webhook_events` `payload_hash` lookup +
 * `terminalStates` check) before this file — `lemon-webhook.test.ts`/
 * `phase12-billing.test.ts` only test the pure signature/parsing
 * functions in `lib/billing/webhook.ts`, never the full request handler
 * in `lib/billing/webhook-handler.ts` with its real Supabase calls.
 * Confirmed this gap by grepping the whole `tests/` tree for
 * `handleLemonWebhook`/`terminalStates`/`payload_hash` before writing
 * this — zero hits. Nothing was "accidentally weakened" to restore; the
 * honest finding is that this coverage never existed, so it's added here.
 */
describe("handleLemonWebhook — signature/store gate, then idempotency", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    resetCalls();
    webhookEventsExisting = null;
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects an invalid signature before touching the database at all", async () => {
    const body = orderCreatedPayload();
    const response = await handleLemonWebhook(requestFor(body, "0".repeat(64)));

    expect(response).toEqual({ status: 401, body: { error: "INVALID_SIGNATURE" } });
    expect(calls["altr_billing_webhook_events"]).toBeUndefined();
  });

  it("rejects a missing signature the same way", async () => {
    const body = orderCreatedPayload();
    const response = await handleLemonWebhook(requestFor(body, null));

    expect(response.status).toBe(401);
    expect(calls["altr_billing_webhook_events"]).toBeUndefined();
  });

  it("rejects an unknown store before writing anything, even with a valid signature", async () => {
    const body = JSON.stringify({
      meta: { event_name: "order_created", custom_data: {} },
      data: { type: "orders", id: "o1", attributes: { store_id: 999, variant_id: 1001 } },
    });
    const response = await handleLemonWebhook(requestFor(body, sign(body)));

    expect(response).toEqual({ status: 403, body: { error: "INVALID_WEBHOOK_STORE" } });
    expect(calls["altr_billing_webhook_events"]).toBeUndefined();
  });

  it("idempotency: a payload already marked 'processed' short-circuits with zero entitlement-affecting writes — the real security property this file exists to prove", async () => {
    webhookEventsExisting = { id: "existing-1", processing_status: "processed", attempt_count: 1 };
    const body = orderCreatedPayload();
    const response = await handleLemonWebhook(requestFor(body, sign(body)));

    expect(response).toEqual({ status: 200, body: { ok: true, duplicate: true } });
    // The only calls against the event-log table are the idempotency
    // lookup itself (select/eq/eq) — no insert/update re-logs a
    // duplicate, and critically, none of the tables that could grant or
    // alter real access are touched at all.
    expect(calls["altr_billing_webhook_events"]?.some((call) => call.method === "insert" || call.method === "update")).toBe(false);
    expect(calls["altr_subscriptions"]).toBeUndefined();
    expect(calls["altr_billing_orders"]).toBeUndefined();
    expect(calls["altr_billing_invoices"]).toBeUndefined();
    expect(calls["altr_audit_events"]).toBeUndefined();
  });

  it.each(["ignored", "orphaned", "quarantined"])(
    "idempotency covers every real terminal state, not just 'processed' (%s)",
    async (processingStatus) => {
      webhookEventsExisting = { id: "existing-1", processing_status: processingStatus, attempt_count: 1 };
      const body = orderCreatedPayload();
      const response = await handleLemonWebhook(requestFor(body, sign(body)));

      expect(response).toEqual({ status: 200, body: { ok: true, duplicate: true } });
      expect(calls["altr_billing_orders"]).toBeUndefined();
      expect(calls["altr_billing_invoices"]).toBeUndefined();
    },
  );

  it("a 'processing' status (a previous attempt crashed mid-flight, not yet terminal) is retried, not treated as a duplicate", async () => {
    webhookEventsExisting = { id: "existing-1", processing_status: "processing", attempt_count: 1 };
    const body = orderCreatedPayload();
    const response = await handleLemonWebhook(requestFor(body, sign(body)));

    expect(response).toEqual({ status: 200, body: { ok: true } });
    expect(calls["altr_billing_orders"]).toBeDefined();
  });

  it("a genuinely new event (never seen before) is processed and stores trusted, allowlist-derived values — never the raw payload's own unvalidated claims", async () => {
    webhookEventsExisting = null;
    const body = orderCreatedPayload();
    const response = await handleLemonWebhook(requestFor(body, sign(body)));

    expect(response).toEqual({ status: 200, body: { ok: true } });
    const orderUpsert = calls["altr_billing_orders"]?.find((call) => call.method === "upsert");
    expect(orderUpsert?.args[0]).toMatchObject({
      user_id: "00000000-0000-4000-8000-000000000001",
      plan_id: "personal",
      status: "paid",
      amount: 2000,
    });
    const invoiceUpsert = calls["altr_billing_invoices"]?.find((call) => call.method === "upsert");
    expect(invoiceUpsert?.args[0]).toMatchObject({ status: "paid", amount: 2000 });
    const finalUpdate = calls["altr_billing_webhook_events"]?.find((call) => call.method === "update");
    expect(finalUpdate?.args[0]).toMatchObject({ processing_status: "processed", error: null });
  });
});
