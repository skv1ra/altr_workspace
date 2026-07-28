import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/billing/plans/route";
import { getCurrentPlanPricing } from "@/lib/billing/lemonsqueezy";

vi.mock("@/lib/billing/lemonsqueezy", () => ({
  getCurrentPlanPricing: vi.fn(),
}));

const mockedPricing = vi.mocked(getCurrentPlanPricing);

describe("public billing plans route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns stable fallback prices when Lemon Squeezy is unavailable", async () => {
    mockedPricing.mockRejectedValue(new Error("LEMONSQUEEZY_CONFIG_INVALID"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.plans).toEqual([
      expect.objectContaining({ planId: "personal", amount: 2000, live: false }),
      expect.objectContaining({ planId: "work", amount: 4000, live: false }),
    ]);
    expect(body.notice).toEqual(expect.any(String));
  });
});
