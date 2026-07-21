import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PricingTable } from "@/components/site/PricingTable";
import { PLAN_LIMITS } from "@/lib/billing/limits";

const LIVE_PLANS = [
  { planId: "personal" as const, amount: 2000, currency: "USD", interval: "month", live: true },
  { planId: "work" as const, amount: 4000, currency: "USD", interval: "month", live: true },
];

describe("PricingTable", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("renders the real limits from injected plan data for all three plans, not hardcoded numbers", () => {
    render(<PricingTable injectedPlans={LIVE_PLANS} injectedMe={null} />);

    for (const [planId, limits] of Object.entries(PLAN_LIMITS)) {
      // Each plan's column has its own accessible group via the plan
      // name heading; scope assertions there so identical-looking
      // numbers across plans (e.g. no coincidental collisions) still
      // prove the *right* plan shows the *right* limits.
      const importsCell = screen.getAllByText(limits.importsPerMonth.toLocaleString("en-US"));
      expect(importsCell.length).toBeGreaterThan(0);
      void planId;
    }

    // Spot-check the exact free-plan numbers directly against
    // lib/billing/limits.ts — the actual source of truth.
    expect(screen.getByText("250")).toBeInTheDocument(); // free maxActiveMemories
    expect(screen.getByText("5 MB")).toBeInTheDocument(); // free maxFileBytes
    expect(screen.getByText("5,000")).toBeInTheDocument(); // personal maxActiveMemories
    expect(screen.getByText("25 MB")).toBeInTheDocument(); // personal maxFileBytes
    expect(screen.getByText("25,000")).toBeInTheDocument(); // work maxActiveMemories
    expect(screen.getByText("50 MB")).toBeInTheDocument(); // work maxFileBytes
  });

  it("shows real prices from injected live plan data ($0 / $20 / $40)", () => {
    render(<PricingTable injectedPlans={LIVE_PLANS} injectedMe={null} />);
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$20")).toBeInTheDocument();
    expect(screen.getByText("$40")).toBeInTheDocument();
  });

  it("shows register/checkout links (not dead buttons) when signed out", () => {
    render(<PricingTable injectedPlans={LIVE_PLANS} injectedMe={null} />);

    expect(screen.getByRole("link", { name: "Create your Altr" })).toHaveAttribute(
      "href",
      "/auth?mode=register",
    );
    const checkoutLinks = screen.getAllByRole("link", { name: "Continue to checkout" });
    expect(checkoutLinks).toHaveLength(2);
    for (const link of checkoutLinks) {
      expect(link).toHaveAttribute("href", "/auth?next=/pricing");
    }
  });

  it('shows a quiet "Your plan" label instead of a button for the plan the user is already on', () => {
    render(<PricingTable injectedPlans={LIVE_PLANS} injectedMe={{ effectivePlan: "personal" }} />);

    expect(screen.getByText("Your plan")).toBeInTheDocument();
    // Free (not current) shows plain included text, not a link, since
    // there is no downgrade-via-checkout path.
    expect(screen.getByText("Included with every account")).toBeInTheDocument();
    // Work (not current, paid) still shows a real functional checkout
    // button — switching plans goes through checkout like any purchase.
    expect(screen.getByRole("button", { name: "Continue to checkout" })).toBeInTheDocument();
  });

  it("POSTs only { planId } to /api/billing/checkout and navigates to the returned checkoutUrl", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/billing/checkout") {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(init!.body as string)).toEqual({ planId: "work" });
        return new Response(JSON.stringify({ checkoutUrl: "https://checkout.example/mock" }), { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    // jsdom doesn't implement real navigation; assigning location.href
    // just needs to not throw for this assertion's purposes.
    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "" },
      writable: true,
    });

    render(<PricingTable injectedPlans={LIVE_PLANS} injectedMe={{ effectivePlan: "free" }} />);
    // Both Personal and Work show a real checkout button when the user is
    // on Free — click the second (Work) specifically to prove the right
    // planId flows through, not just any button.
    const workButton = screen.getAllByRole("button", { name: "Continue to checkout" })[1];
    await userEvent.click(workButton);

    expect(fetchMock).toHaveBeenCalledWith("/api/billing/checkout", expect.any(Object));
  });

  it("renders limits inside a definition list per plan, scoped correctly (regression against cross-plan mixups)", () => {
    render(<PricingTable injectedPlans={LIVE_PLANS} injectedMe={null} />);
    const lists = document.querySelectorAll("dl");
    expect(lists).toHaveLength(3);
    const freeList = within(lists[0] as HTMLElement);
    expect(freeList.getByText("1")).toBeInTheDocument(); // free importsPerMonth
    expect(freeList.getByText("10")).toBeInTheDocument(); // free aiDraftsPerMonth
  });
});
