import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BillingOverview } from "@/components/app/billing/BillingOverview";

const usage = { activeMemoriesUsed: 5, draftsUsedThisMonth: 2, importsUsedThisMonth: 1 };

function meResponse(overrides: Record<string, unknown> = {}) {
  return {
    effectivePlan: "personal",
    hasPremium: true,
    entitlementReason: "active",
    subscription: {
      planId: "personal",
      status: "active",
      renewsAt: "2026-08-15T00:00:00.000Z",
      endsAt: null,
      trialEndsAt: null,
      cancelled: false,
      testMode: false,
      canManage: true,
    },
    invoices: [],
    ...overrides,
  };
}

function mockFetch(body: unknown, ok = true) {
  return vi.fn(async () => ({ ok, json: async () => body }));
}

beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: { ...window.location, assign: vi.fn() },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BillingOverview — plan/subscription states", () => {
  it("never subscribed (subscription: null): shows the Free framing and a real 'Choose a plan' link, no Manage subscription button", async () => {
    vi.stubGlobal("fetch", mockFetch(meResponse({ effectivePlan: "free", hasPremium: false, entitlementReason: "no_subscription", subscription: null })));
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("You're on the Free plan.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose a plan" })).toHaveAttribute("href", "/pricing");
    expect(screen.queryByRole("button", { name: /Manage subscription/ })).not.toBeInTheDocument();
  });

  it("active subscription: shows the real status and the real renewal date, with a working Manage subscription button", async () => {
    vi.stubGlobal("fetch", mockFetch(meResponse()));
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("Status: Active")).toBeInTheDocument();
    expect(screen.getByText(/Renews/)).toHaveTextContent("August 15, 2026");
    expect(screen.getByRole("button", { name: "Manage subscription" })).toBeInTheDocument();
  });

  it("on-trial subscription: shows the real trial-end date, not a renewal date", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        meResponse({
          entitlementReason: "on_trial",
          subscription: { planId: "work", status: "on_trial", renewsAt: null, endsAt: null, trialEndsAt: "2026-08-01T00:00:00.000Z", cancelled: false, testMode: false, canManage: true },
        }),
      ),
    );
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("Status: Trial")).toBeInTheDocument();
    expect(screen.getByText(/Trial ends/)).toHaveTextContent("August 1, 2026");
    expect(screen.queryByText(/^Renews/)).not.toBeInTheDocument();
  });

  it("cancelled but still within its paid period: shows honest 'access continues until' copy and a real Resubscribe link, alongside Manage subscription", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        meResponse({
          entitlementReason: "cancelled_until_end",
          subscription: { planId: "personal", status: "cancelled", renewsAt: null, endsAt: "2026-09-01T00:00:00.000Z", trialEndsAt: null, cancelled: true, testMode: false, canManage: true },
        }),
      ),
    );
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("Status: Cancelled")).toBeInTheDocument();
    expect(screen.getByText(/Access continues until/)).toHaveTextContent("September 1, 2026");
    expect(screen.getByRole("link", { name: "Resubscribe" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("button", { name: "Manage subscription" })).toBeInTheDocument();
  });

  it("past due within the grace period (still has access): shows the calm failed-payment alert with grace copy and a Fix payment method action", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        meResponse({
          hasPremium: true,
          entitlementReason: "past_due_grace",
          subscription: { planId: "personal", status: "past_due", renewsAt: null, endsAt: null, trialEndsAt: null, cancelled: false, testMode: false, canManage: true },
        }),
      ),
    );
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("There was a problem with your last payment.")).toBeInTheDocument();
    expect(screen.getByText(/grace period while the payment is retried/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fix payment method" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Manage subscription" })).not.toBeInTheDocument();
  });

  it("past due after the grace period lapsed (access ended): shows the lapsed copy, not the grace copy", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        meResponse({
          hasPremium: false,
          entitlementReason: "past_due",
          subscription: { planId: "personal", status: "past_due", renewsAt: null, endsAt: null, trialEndsAt: null, cancelled: false, testMode: false, canManage: true },
        }),
      ),
    );
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("There was a problem with your last payment.")).toBeInTheDocument();
    expect(screen.getByText("Your access has paused until this is resolved.")).toBeInTheDocument();
    expect(screen.queryByText(/grace period/)).not.toBeInTheDocument();
  });

  it("lapsed (expired/paused/unpaid — access genuinely ended, not past-due): shows the access-ended alert plus both Manage subscription and Choose a plan", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        meResponse({
          hasPremium: false,
          entitlementReason: "expired",
          subscription: { planId: "personal", status: "expired", renewsAt: null, endsAt: null, trialEndsAt: null, cancelled: false, testMode: false, canManage: true },
        }),
      ),
    );
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("Your plan access has ended.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage subscription" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose a plan" })).toHaveAttribute("href", "/pricing");
  });

  it("test-mode subscriptions show the real test-mode notice, not silently hidden", async () => {
    vi.stubGlobal("fetch", mockFetch(meResponse({ subscription: { ...meResponse().subscription, testMode: true } })));
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("Test mode")).toBeInTheDocument();
  });

  it("Manage subscription is hidden when the real payload says canManage: false, even with an active subscription", async () => {
    vi.stubGlobal("fetch", mockFetch(meResponse({ subscription: { ...meResponse().subscription, canManage: false } })));
    render(<BillingOverview {...usage} />);

    await screen.findByText("Status: Active");
    expect(screen.queryByRole("button", { name: "Manage subscription" })).not.toBeInTheDocument();
  });
});

describe("BillingOverview — portal pending state and error handling", () => {
  it("shows a pending state while the portal request is in flight, then assigns the real fresh URL from the response — never a cached/static href", async () => {
    let resolvePortal: (value: unknown) => void = () => {};
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/billing/me") return { ok: true, json: async () => meResponse() };
      if (url === "/api/billing/portal" && init?.method === "POST") {
        return new Promise((resolve) => {
          resolvePortal = () => resolve({ ok: true, status: 200, json: async () => ({ portalUrl: "https://billing.lemonsqueezy.com/fresh-session-token" }) });
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<BillingOverview {...usage} />);
    await screen.findByRole("button", { name: "Manage subscription" });

    await userEvent.click(screen.getByRole("button", { name: "Manage subscription" }));
    expect(screen.getByRole("button", { name: "Opening…" })).toBeDisabled();

    resolvePortal(null);

    await waitFor(() => expect(window.location.assign).toHaveBeenCalledWith("https://billing.lemonsqueezy.com/fresh-session-token"));
  });

  it("a real 404 SUBSCRIPTION_NOT_FOUND shows the designed explanation, not a raw error", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/billing/me") return { ok: true, json: async () => meResponse() };
      if (url === "/api/billing/portal" && init?.method === "POST") return { ok: false, status: 404, json: async () => ({ error: "SUBSCRIPTION_NOT_FOUND" }) };
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<BillingOverview {...usage} />);
    await screen.findByRole("button", { name: "Manage subscription" });

    await userEvent.click(screen.getByRole("button", { name: "Manage subscription" }));

    expect(await screen.findByText("This subscription can no longer be managed here. Refresh the page and try again.")).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("a generic portal failure shows a plain retry-worthy message, not a crash", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/billing/me") return { ok: true, json: async () => meResponse() };
      if (url === "/api/billing/portal" && init?.method === "POST") return { ok: false, status: 500, json: async () => ({ error: "PORTAL_FAILED" }) };
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<BillingOverview {...usage} />);
    await screen.findByRole("button", { name: "Manage subscription" });

    await userEvent.click(screen.getByRole("button", { name: "Manage subscription" }));

    expect(await screen.findByText("Couldn't open the billing portal — try again.")).toBeInTheDocument();
  });
});

describe("BillingOverview — quota summary rows (real PLAN_LIMITS constants, real usage counts, no client math)", () => {
  it("renders each QuotaMeter with the real server-provided usage count against the real plan limit constant", async () => {
    vi.stubGlobal("fetch", mockFetch(meResponse({ effectivePlan: "personal" })));
    render(<BillingOverview activeMemoriesUsed={250} draftsUsedThisMonth={100} importsUsedThisMonth={3} />);

    await screen.findByText("Status: Active");
    // Personal plan real limits: maxActiveMemories 5000, aiDraftsPerMonth 500, importsPerMonth 10.
    expect(screen.getByText("250 / 5000")).toBeInTheDocument();
    expect(screen.getByText("100 / 500")).toBeInTheDocument();
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
  });
});

describe("BillingOverview — invoice history empty states", () => {
  it("never subscribed: shows the free-specific empty invitation", async () => {
    vi.stubGlobal("fetch", mockFetch(meResponse({ effectivePlan: "free", hasPremium: false, entitlementReason: "no_subscription", subscription: null })));
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("Invoices appear here once you're on a paid plan.")).toBeInTheDocument();
  });

  it("active subscription with zero invoices (webhook timing edge case): shows the 'receipt on its way' state, not a bare empty list", async () => {
    vi.stubGlobal("fetch", mockFetch(meResponse({ invoices: [] })));
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("Payment received — the receipt is on its way and will appear here shortly.")).toBeInTheDocument();
  });

  it("load failure shows the honest error state, not a crash or a fabricated Free view", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ error: "BILLING_ME_FAILED" }) })));
    render(<BillingOverview {...usage} />);

    expect(await screen.findByText("Couldn't load your billing information.")).toBeInTheDocument();
  });
});
