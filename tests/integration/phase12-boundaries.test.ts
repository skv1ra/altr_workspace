// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");
const handlerBody = () => {
  const source = read("lib/billing/webhook-handler.ts");
  return source.slice(source.indexOf("export async function handleLemonWebhook"));
};

/**
 * Adapted from LEGACY's own `tests/integration/phase12-boundaries.test.ts`
 * (pinned `a22927d`) for Prompt 047 — same real invariants, verified
 * against this rebuild's actual current paths (`PaymentConfirmation.tsx`
 * moved under `components/app/billing/`; `app/legacy-migration/page.tsx`'s
 * own copy no longer matches LEGACY's exact Ukrainian string, so this
 * asserts the real `safeProfile` allowlist shape instead of one literal
 * sentence), plus new endpoints this prompt's own instructions name
 * explicitly: the draft-history/feedback routes (040) and the onboarding
 * flag (031), neither of which existed when LEGACY's own version of this
 * file was written.
 */
describe("server-authoritative billing boundaries", () => {
  it("makes webhook replay idempotent before any writes", () => {
    const body = handlerBody();
    expect(body).toContain('terminalStates.has(existing.data?.processing_status');
    expect(body).toContain("duplicate: true");
    expect(body.indexOf("terminalStates.has")).toBeLessThan(body.indexOf('processing_status: "processing"'));
  });

  it("rejects invalid signatures before parsing or storage", () => {
    const body = handlerBody();
    const verify = body.indexOf("verifyLemonSignature(rawBody");
    const parse = body.indexOf("parseVerifiedLemonWebhook(rawBody)");
    const eventWrite = body.indexOf('from("altr_billing_webhook_events")');
    expect(verify).toBeGreaterThanOrEqual(0);
    expect(parse).toBeGreaterThan(verify);
    expect(eventWrite).toBeGreaterThan(verify);
    expect(body).toContain("status: 401");
  });

  it("quarantines unknown variants before subscription mutation", () => {
    const body = handlerBody();
    const quarantine = body.indexOf('finish("quarantined", "UNKNOWN_VARIANT")');
    const afterQuarantine = body.slice(quarantine);
    const subscriptionMutation = afterQuarantine.indexOf('from("altr_subscriptions").select("id")');
    expect(quarantine).toBeGreaterThanOrEqual(0);
    expect(subscriptionMutation).toBeGreaterThan(0);
  });

  it("does not activate subscriptions from the payment success URL — it only ever re-checks the real, server-authoritative GET /api/billing/me", () => {
    const page = read("components/app/billing/PaymentConfirmation.tsx");
    expect(page).toContain('fetch("/api/billing/me"');
    expect(page).not.toMatch(/activatePaidSubscription|subscription.*insert|plan.*update/i);
  });

  it("isolates billing reads by the authenticated user", () => {
    const source = read("app/api/billing/me/route.ts");
    expect(source.match(/\.eq\("user_id", user\.id\)/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("data ownership and quotas", () => {
  it("scopes every memory mutation to the authenticated user", () => {
    const collection = read("app/api/memories/route.ts");
    const item = read("app/api/memories/[id]/route.ts");
    expect(collection).toContain('.eq("user_id", user.id)');
    expect(collection).toContain("user_id: user.id");
    expect(item.match(/\.eq\("user_id", user\.id\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("scopes import reads, writes, and deletion to the authenticated user", () => {
    for (const path of ["app/api/imports/route.ts", "app/api/imports/[id]/route.ts", "app/api/imports/[id]/chunks/route.ts"]) {
      const source = read(path);
      expect(source).toContain("user.id");
      expect(source).toMatch(/\.eq\("user_id", user\.id\)|user_id: user\.id/);
    }
  });

  it("enforces import monthly/concurrency/file/message/conversation quotas", () => {
    const create = read("app/api/imports/route.ts");
    const chunks = read("app/api/imports/[id]/chunks/route.ts");
    for (const code of ["FILE_SIZE_LIMIT_REACHED", "IMPORT_MONTHLY_QUOTA_REACHED", "IMPORT_CONCURRENCY_LIMIT"]) expect(create).toContain(code);
    for (const code of ["MESSAGE_LIMIT_REACHED", "CONVERSATION_LIMIT_REACHED"]) expect(chunks).toContain(code);
  });

  it("enforces the AI monthly quota before calling OpenAI", () => {
    const source = read("app/api/ai/draft-reply/route.ts");
    expect(source).toContain("AI_DRAFT_QUOTA_REACHED");
    expect(source.indexOf("AI_DRAFT_QUOTA_REACHED")).toBeLessThan(source.indexOf("requireOpenAI()"));
  });

  // Prompt 047's own new coverage — 040's draft-history endpoints
  // (list + feedback) had no dedicated ownership-boundary test anywhere.
  it("scopes the draft-history list to the authenticated user", () => {
    const source = read("app/api/ai/drafts/route.ts");
    expect(source).toContain('.eq("user_id", user.id)');
  });

  it("verifies draft ownership before recording feedback, and never trusts a client-supplied user_id on the write itself", () => {
    const source = read("app/api/ai/drafts/[id]/feedback/route.ts");
    // The lookup that gates access is scoped by both the run id AND the
    // caller's own id — an attacker guessing another user's real run id
    // still gets DRAFT_NOT_FOUND, not their feedback attached to it.
    expect(source).toMatch(/\.eq\("id", runId\)\s*\n?\s*\.eq\("user_id", user\.id\)/);
    expect(source).toContain("DRAFT_NOT_FOUND");
    // The write itself sets user_id from the trusted session, never from
    // request input (the zod schema for the body has no user_id field).
    expect(source).toContain("user_id: user.id,");
  });

  // Prompt 047's own new coverage — 039's assistant/Twin config endpoints.
  it("scopes assistant (Twin) reads and writes to the authenticated user", () => {
    const list = read("app/api/assistants/route.ts");
    const update = read("app/api/assistants/[id]/route.ts");
    expect(list).toContain('.eq("user_id", user.id)');
    expect(update).toMatch(/\.eq\("id", id\)\.eq\("user_id", user\.id\)/);
  });

  // Prompt 047's own new coverage — 031's onboarding-completion flag,
  // part of the same PATCH /api/me handler as every other profile field.
  it("scopes the onboarding-completion flag write to the authenticated user, same as every other profile field", () => {
    const source = read("app/api/me/route.ts");
    expect(source).toContain("onboardingCompleted");
    expect(source).toMatch(/profileUpdate\.onboarding_completed = input\.onboardingCompleted/);
    expect(source).toContain('.eq("user_id", user.id)');
  });
});

describe("legacy migration restrictions", () => {
  it("only scans Altr-prefixed local storage keys, and its 'safe profile' migration is an allowlist that structurally cannot include plan, subscription, payment, or password data", () => {
    const source = read("app/legacy-migration/page.tsx");
    expect(source).toContain("LEGACY_PATTERN");
    expect(source).toContain("safeProfile");
    // The allowlist itself — read directly, not inferred — only ever
    // assigns from these five keys. If a future edit widened it to
    // spread arbitrary fields from local storage instead, this fails.
    const safeProfileBody = source.slice(source.indexOf("const safeProfile = useMemo"), source.indexOf("}, [entries]);"));
    for (const forbidden of ["plan", "subscription", "payment", "password", "token"]) {
      expect(safeProfileBody.toLowerCase()).not.toContain(forbidden);
    }
    for (const allowed of ["name:", "altrName:", "bio:", "tone:", "preferences:"]) {
      expect(safeProfileBody).toContain(allowed);
    }
  });
});
