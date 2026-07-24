import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";

/*
 * `app/auth/callback/route.ts` is in this prompt's own "files that must
 * not be changed" list, same as 026/027 — but nothing stopped it from
 * being *tested*. Its three real entry points (email confirm, password
 * recovery, Google OAuth) were only ever traced from source in 026's
 * STATUS.md entry; this closes that gap with real, mocked-Supabase
 * coverage of the route handler itself, addressing this prompt's own
 * "callback redirects" item in the required coverage list.
 */

const exchangeCodeForSession = vi.fn();
const upsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ auth: { exchangeCodeForSession } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ from: () => ({ upsert }) }),
}));

function requestFor(path: string) {
  return new NextRequest(new URL(path, "https://altr.example"));
}

describe("auth callback route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /auth?mode=login&error=callback when no code is present", async () => {
    const response = await GET(requestFor("/auth/callback"));

    expect(response.headers.get("location")).toBe("https://altr.example/auth?mode=login&error=callback");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects to /auth?mode=login&error=callback when the code exchange fails (expired, reused, or wrong-browser link)", async () => {
    exchangeCodeForSession.mockResolvedValue({ data: { user: null }, error: new Error("invalid grant") });

    const response = await GET(requestFor("/auth/callback?code=bad"));

    expect(response.headers.get("location")).toBe("https://altr.example/auth?mode=login&error=callback");
  });

  it("email-confirm / OAuth shape: on a valid code, upserts the profile, sets the legacy-review cookie, and redirects to /legacy-migration", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "u1", email: "real@example.com", user_metadata: { full_name: "Real User" } } },
      error: null,
    });

    const response = await GET(requestFor("/auth/callback?code=good&next=/legacy-migration"));

    expect(response.headers.get("location")).toBe("https://altr.example/legacy-migration");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", email: "real@example.com", name: "Real User" }),
    );
    expect(response.cookies.get("altr_legacy_review")?.value).toBe("pending");
  });

  it("recovery shape: on a valid code, redirects to the caller-supplied /auth/reset-password next path", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "u1", email: "real@example.com", user_metadata: {} } },
      error: null,
    });

    const response = await GET(requestFor("/auth/callback?code=good&next=/auth/reset-password"));

    expect(response.headers.get("location")).toBe("https://altr.example/auth/reset-password");
  });

  it("rejects an off-origin next param, falling back to /legacy-migration instead of trusting it", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "u1", email: "real@example.com", user_metadata: {} } },
      error: null,
    });

    const response = await GET(requestFor("/auth/callback?code=good&next=https://evil.example/phish"));

    expect(response.headers.get("location")).toBe("https://altr.example/legacy-migration");
  });
});
