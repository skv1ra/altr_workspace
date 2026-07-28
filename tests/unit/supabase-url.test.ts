import { describe, expect, it } from "vitest";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/url";

describe("normalizeSupabaseProjectUrl", () => {
  it.each([
    ["https://project.supabase.co", "https://project.supabase.co"],
    ["https://project.supabase.co/", "https://project.supabase.co"],
    ["https://project.supabase.co/rest/v1", "https://project.supabase.co"],
    ["https://project.supabase.co/auth/v1/", "https://project.supabase.co"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeSupabaseProjectUrl(input)).toBe(expected);
  });
});
