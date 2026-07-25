import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PaymentConfirmation } from "@/components/app/billing/PaymentConfirmation";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

async function advancePolls(count: number) {
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await vi.advanceTimersByTimeAsync(3_000);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("PaymentConfirmation — state machine (039's own 'pending vs confirmed clearly distinct' requirement)", () => {
  it("shows the honest pending state on first render, before any confirmation — never an implied success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ effectivePlan: "free", hasPremium: false, subscription: null })));
    render(<PaymentConfirmation />);

    expect(await screen.findByText("Payment received. Confirming your plan…")).toBeInTheDocument();
    expect(screen.queryByText(/is active\.$/)).not.toBeInTheDocument();
  });

  it("shows the confirmed state, with the real server-provided plan name, once hasPremium genuinely flips true", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ effectivePlan: "work", hasPremium: true, subscription: { status: "active" } })));
    render(<PaymentConfirmation />);

    expect(await screen.findByText("Plan Work is active.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
  });

  it("never fabricates the confirmed state across repeated real polls when the server consistently says hasPremium: false — the core billing invariant this page exists to prove", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => jsonResponse({ effectivePlan: "free", hasPremium: false, subscription: null }));
    vi.stubGlobal("fetch", fetchMock);
    render(<PaymentConfirmation />);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await advancePolls(5);

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText("Payment received. Confirming your plan…")).toBeInTheDocument();
    expect(screen.queryByText(/is active\.$/)).not.toBeInTheDocument();
  });

  it("after the full unchanged 10-poll/30-second window, a real-but-unresolved subscription row shows the 'taking longer' timeout state — not an implied failure", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ effectivePlan: "personal", hasPremium: false, subscription: { status: "past_due" } })));
    render(<PaymentConfirmation />);

    await advancePolls(10);

    expect(screen.getByText("This is taking longer than expected.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open billing" })).toHaveAttribute("href", "/billing");
  });

  it("after the full 30-second window with subscription still null throughout (the 'visited directly, nothing pending' edge case), shows the honest neutral state instead of the same 'still confirming' copy as a real in-flight purchase", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ effectivePlan: "free", hasPremium: false, subscription: null })));
    render(<PaymentConfirmation />);

    await advancePolls(10);

    expect(screen.getByText("No pending confirmation.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open billing" })).toHaveAttribute("href", "/billing");
  });

  it("Refresh triggers a real re-check and can transition straight to confirmed, without waiting for the next scheduled poll", async () => {
    let hasPremium = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ effectivePlan: "personal", hasPremium, subscription: hasPremium ? { status: "active" } : null })),
    );
    render(<PaymentConfirmation />);
    await screen.findByText("Payment received. Confirming your plan…");

    hasPremium = true;
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(await screen.findByText("Plan Personal is active.")).toBeInTheDocument();
  });

  it("a failed billing check during polling is treated as unconfirmed and doesn't crash the page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "BILLING_STATE_FAILED" }, false)));
    render(<PaymentConfirmation />);

    expect(await screen.findByText("Payment received. Confirming your plan…")).toBeInTheDocument();
  });
});
