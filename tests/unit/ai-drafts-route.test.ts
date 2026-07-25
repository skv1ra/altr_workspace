import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/ai/drafts/route";

const requireUser = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  requireUser: () => requireUser(),
  createSupabaseAdminClient: () => ({ from }),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  assertAuthRateLimit: vi.fn().mockResolvedValue({ remaining: 1, resetAt: "" }),
  getRequestIdentity: () => "test-identity",
}));

function requestFor(path: string) {
  return new NextRequest(new URL(path, "https://altr.example"));
}

function queryBuilder(result: { data: unknown; error: unknown; count: number | null }) {
  const builder = {
    select: vi.fn((_columns: string, _options?: { count: string }) => builder),
    eq: vi.fn((_column: string, _value: string) => builder),
    order: vi.fn((_column: string, _options?: { ascending: boolean }) => builder),
    range: vi.fn((_from: number, _to: number) => Promise.resolve(result)),
  };
  return builder;
}

/**
 * Prompt 040's own "Unit: runs endpoint (if created) ownership scoping"
 * required test — `app/api/ai/drafts/route.ts` is new this prompt (no
 * list endpoint over `altr_assistant_runs` existed before). Mirrors
 * `tests/unit/auth-callback.test.ts`'s own mocking approach for a
 * must-not-... well, in this case a *just-written* route handler tested
 * directly, not through RTL/HTTP.
 */
describe("GET /api/ai/drafts", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the query to the authenticated user's own id via .eq(user_id, ...) — real ownership scoping, not trusted from a param", async () => {
    requireUser.mockResolvedValue({ id: "user-1" });
    const builder = queryBuilder({ data: [{ id: "run-1" }], error: null, count: 1 });
    from.mockReturnValue(builder);

    await GET(requestFor("/api/ai/drafts"));

    expect(from).toHaveBeenCalledWith("altr_assistant_runs");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("never selects the raw usage jsonb column (token/cost internals) — this prompt's own security requirement", async () => {
    requireUser.mockResolvedValue({ id: "user-1" });
    const builder = queryBuilder({ data: [], error: null, count: 0 });
    from.mockReturnValue(builder);

    await GET(requestFor("/api/ai/drafts"));

    const selectedColumns = builder.select.mock.calls[0][0] as string;
    expect(selectedColumns).not.toMatch(/\busage\b/);
    expect(selectedColumns).toMatch(/\binput_text\b/);
    expect(selectedColumns).toMatch(/\boutput_text\b/);
  });

  it("paginates with the same page/pageSize/total/totalPages shape GET /api/memories already uses, clamping an oversized pageSize to 50", async () => {
    requireUser.mockResolvedValue({ id: "user-1" });
    const builder = queryBuilder({ data: [], error: null, count: 120 });
    from.mockReturnValue(builder);

    const response = await GET(requestFor("/api/ai/drafts?page=2&pageSize=999"));
    const body = await response.json();

    expect(builder.range).toHaveBeenCalledWith(50, 99);
    expect(body).toMatchObject({ page: 2, pageSize: 50, total: 120, totalPages: 3 });
  });

  it("rate-limits the request using the dedicated ai_drafts_list action — deliberately not the ai_generation budget, and not skipped", async () => {
    const { assertAuthRateLimit } = await import("@/lib/auth/rate-limit");
    requireUser.mockResolvedValue({ id: "user-1" });
    from.mockReturnValue(queryBuilder({ data: [], error: null, count: 0 }));

    await GET(requestFor("/api/ai/drafts"));

    expect(assertAuthRateLimit).toHaveBeenCalledWith("ai_drafts_list", "test-identity");
  });

  it("returns 401 AUTH_REQUIRED when there is no session, never reaching the database", async () => {
    requireUser.mockRejectedValue(new Error("AUTH_REQUIRED"));

    const response = await GET(requestFor("/api/ai/drafts"));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    const { assertAuthRateLimit } = await import("@/lib/auth/rate-limit");
    vi.mocked(assertAuthRateLimit).mockRejectedValueOnce(new Error("RATE_LIMITED"));
    requireUser.mockResolvedValue({ id: "user-1" });

    const response = await GET(requestFor("/api/ai/drafts"));

    expect(response.status).toBe(429);
    expect(from).not.toHaveBeenCalled();
  });

  /**
   * Prompt 041's own required test: "user A cannot list user B's runs."
   * Stronger than the structural `.eq("user_id", ...)` assertion above —
   * this one simulates a real two-tenant table (rows for both users
   * present) and drives the actual filtering the mocked `.eq()` performs,
   * so the assertion fails if the route's `user.id` were ever plumbed
   * into the query incorrectly (e.g. swapped for a body/query param, or
   * dropped entirely), not just if the call happened to be made.
   */
  it("user A cannot list user B's runs — the query, driven against a real two-user dataset, returns only the authenticated user's own rows", async () => {
    const allRows = [
      { id: "run-a-1", user_id: "user-a", input_text: "A's message" },
      { id: "run-a-2", user_id: "user-a", input_text: "A's other message" },
      { id: "run-b-1", user_id: "user-b", input_text: "B's private message" },
    ];

    function tenantAwareBuilder() {
      let scopedUserId: string | null = null;
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn((column: string, value: string) => {
          if (column === "user_id") scopedUserId = value;
          return builder;
        }),
        order: vi.fn(() => builder),
        range: vi.fn(() =>
          Promise.resolve({
            data: allRows.filter((row) => row.user_id === scopedUserId),
            error: null,
            count: allRows.filter((row) => row.user_id === scopedUserId).length,
          }),
        ),
      };
      return builder;
    }

    requireUser.mockResolvedValue({ id: "user-a" });
    from.mockReturnValue(tenantAwareBuilder());

    const response = await GET(requestFor("/api/ai/drafts"));
    const body = await response.json();

    expect(body.runs).toHaveLength(2);
    expect(body.runs.every((run: { user_id: string }) => run.user_id === "user-a")).toBe(true);
    expect(body.runs.some((run: { id: string }) => run.id === "run-b-1")).toBe(false);
    expect(JSON.stringify(body.runs)).not.toContain("B's private message");
  });
});
