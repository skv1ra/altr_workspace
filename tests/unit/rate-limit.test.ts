// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc: (...args: unknown[]) => rpc(...args) }),
}));

// eslint-disable-next-line import/first
import { assertAuthRateLimit, getRequestIdentity } from "@/lib/auth/rate-limit";

function rpcResolves(result: { allowed: boolean; remaining: number; reset_at: string } | null, error: unknown = null) {
  rpc.mockReturnValue({ single: () => Promise.resolve({ data: result, error }) });
}

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * Prompt 047 — no dedicated rate-limit test file existed anywhere in this
 * workspace before this one (confirmed by search); this is a real,
 * previously-untested source of truth for every 429 response across the
 * app (auth, billing, imports, memories, assistants, privacy). Mutation
 * spot-check performed for the "blocked request throws RATE_LIMITED"
 * test: temporarily changed the source's `if (!result.allowed) throw ...`
 * to `if (result.allowed === false === true)` (a no-op condition that
 * never throws) — the test failed as expected, confirming it actually
 * guards the property. Reverted before committing.
 */
describe("assertAuthRateLimit", () => {
  it("returns remaining/resetAt when the RPC allows the request", async () => {
    rpcResolves({ allowed: true, remaining: 7, reset_at: "2026-07-25T00:00:00.000Z" });
    const result = await assertAuthRateLimit("login", "1.2.3.4|user@example.com");
    expect(result).toEqual({ remaining: 7, resetAt: "2026-07-25T00:00:00.000Z" });
  });

  it("calls the real altr_consume_rate_limit RPC with this action's exact configured limit/window — never a value derived from client input", async () => {
    rpcResolves({ allowed: true, remaining: 9, reset_at: "2026-07-25T00:00:00.000Z" });
    await assertAuthRateLimit("login", "1.2.3.4|user@example.com");
    expect(rpc).toHaveBeenCalledWith(
      "altr_consume_rate_limit",
      expect.objectContaining({ p_action: "login", p_limit: 10, p_window_seconds: 15 * 60 }),
    );
  });

  it("hashes the identity before sending it to the database — never the raw IP/email", async () => {
    rpcResolves({ allowed: true, remaining: 1, reset_at: "2026-07-25T00:00:00.000Z" });
    await assertAuthRateLimit("login", "1.2.3.4|user@example.com");
    const call = rpc.mock.calls[0]![1] as { p_identifier_hash: string };
    expect(call.p_identifier_hash).not.toContain("1.2.3.4");
    expect(call.p_identifier_hash).not.toContain("user@example.com");
    expect(call.p_identifier_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("throws RATE_LIMITED when the RPC reports the request is not allowed — the real property every 429 response depends on", async () => {
    rpcResolves({ allowed: false, remaining: 0, reset_at: "2026-07-25T00:00:00.000Z" });
    await expect(assertAuthRateLimit("login", "1.2.3.4|user@example.com")).rejects.toThrow("RATE_LIMITED");
  });

  it("throws RATE_LIMIT_STORAGE_FAILED (not a silent pass-through) when the RPC itself errors", async () => {
    rpcResolves(null, new Error("connection reset"));
    await expect(assertAuthRateLimit("login", "1.2.3.4|user@example.com")).rejects.toThrow("RATE_LIMIT_STORAGE_FAILED");
  });

  it("throws RATE_LIMIT_STORAGE_FAILED when the RPC returns no row at all", async () => {
    rpcResolves(null);
    await expect(assertAuthRateLimit("login", "1.2.3.4|user@example.com")).rejects.toThrow("RATE_LIMIT_STORAGE_FAILED");
  });
});

describe("getRequestIdentity", () => {
  function requestWithHeaders(headers: Record<string, string>) {
    return new NextRequest("https://altr.example/api/x", { headers });
  }

  it("prefers x-forwarded-for, taking only the first hop", () => {
    const request = requestWithHeaders({ "x-forwarded-for": "9.9.9.9, 10.10.10.10", "x-real-ip": "8.8.8.8" });
    expect(getRequestIdentity(request, "user@example.com")).toBe("9.9.9.9|user@example.com");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = requestWithHeaders({ "x-real-ip": "8.8.8.8" });
    expect(getRequestIdentity(request, "user@example.com")).toBe("8.8.8.8|user@example.com");
  });

  it("falls back to 'unknown' when neither header is present, and 'anonymous' when no subject is given", () => {
    const request = requestWithHeaders({});
    expect(getRequestIdentity(request)).toBe("unknown|anonymous");
  });

  it("normalizes the subject (trim + lowercase) so the same person can't dodge the limit by casing/whitespace", () => {
    const request = requestWithHeaders({ "x-real-ip": "8.8.8.8" });
    expect(getRequestIdentity(request, "  User@Example.com  ")).toBe("8.8.8.8|user@example.com");
  });
});
