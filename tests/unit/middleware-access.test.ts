import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { updateSession } from "@/lib/supabase/middleware";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function request(path: string) {
  return new NextRequest(new URL(path, "https://altr.example"));
}

describe("middleware access boundaries", () => {
  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  it.each(["/dashboard", "/onboarding", "/settings", "/privacy-center"])(
    "redirects an anonymous visitor from %s to login instead of rendering a 500",
    async (path) => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await updateSession(request(path));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain(`/auth?mode=login&next=${encodeURIComponent(path)}`);
    },
  );

  it.each(["/api/billing/plans", "/api/privacy/deletion-requests"])(
    "keeps the intentionally public endpoint %s reachable without a session",
    async (path) => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await updateSession(request(path));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    },
  );

  it("does not make lookalike API paths public through prefix matching", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await updateSession(request("/api/billing/plans-private"));

    expect(response.status).toBe(401);
  });
});
