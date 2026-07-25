import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReceiptDetail } from "@/components/app/billing/ReceiptDetail";

function invoiceFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    invoiceId: "inv_1",
    orderId: "order-123",
    status: "paid",
    amount: 2000,
    currency: "USD",
    receiptUrl: "https://app.lemonsqueezy.com/my-orders/receipt-1",
    issuedAt: "2026-07-01T00:00:00.000Z",
    paidAt: "2026-07-01T00:05:00.000Z",
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReceiptDetail", () => {
  it("finds and renders the one real invoice matching the URL's orderId, from the real GET /api/billing/me response — no dedicated backend route needed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ invoices: [invoiceFixture(), invoiceFixture({ orderId: "order-456", id: "row-2" })] }) })),
    );
    render(<ReceiptDetail orderId="order-123" />);

    expect(await screen.findByText("order-123")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
  });

  it("links to the invoice's own real, provider-hosted receiptUrl — not an internal route that doesn't exist", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ invoices: [invoiceFixture()] }) })));
    render(<ReceiptDetail orderId="order-123" />);

    await screen.findByText("order-123");
    const link = screen.getByRole("link", { name: /View original receipt/ });
    expect(link).toHaveAttribute("href", "https://app.lemonsqueezy.com/my-orders/receipt-1");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("an orderId not present in this user's own invoices shows the honest not-found state — never another user's data, never a crash", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ invoices: [invoiceFixture({ orderId: "someone-elses-order" })] }) })));
    render(<ReceiptDetail orderId="order-does-not-exist" />);

    expect(await screen.findByText("Receipt not found.")).toBeInTheDocument();
    expect(screen.queryByText("someone-elses-order")).not.toBeInTheDocument();
  });

  it("a load failure shows the honest error state, not a crash or a fabricated receipt", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ error: "BILLING_ME_FAILED" }) })));
    render(<ReceiptDetail orderId="order-123" />);

    expect(await screen.findByText("Couldn't load your billing history.")).toBeInTheDocument();
  });

  it("an invoice with no receiptUrl shows no broken/dead 'view original receipt' link", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ invoices: [invoiceFixture({ receiptUrl: null })] }) })));
    render(<ReceiptDetail orderId="order-123" />);

    await screen.findByText("order-123");
    expect(screen.queryByRole("link", { name: /View original receipt/ })).not.toBeInTheDocument();
  });
});
