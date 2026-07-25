import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InvoiceHistoryTable, type BillingInvoice } from "@/components/app/billing/InvoiceHistoryTable";

function invoiceFixture(overrides: Partial<BillingInvoice> = {}): BillingInvoice {
  return {
    id: "11111111-1111-4111-8111-111111111111",
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

describe("InvoiceHistoryTable", () => {
  it("renders a real <table> with the real date/amount/status for each invoice, tabular numerals on the amount column", () => {
    render(<InvoiceHistoryTable invoices={[invoiceFixture()]} lang="EN" />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Jul 1, 2026")).toBeInTheDocument();
  });

  it("a receipt link points at the invoice's own real, provider-hosted receiptUrl — not an internal route that doesn't exist yet", () => {
    render(<InvoiceHistoryTable invoices={[invoiceFixture()]} lang="EN" />);

    const link = screen.getByRole("link", { name: "View receipt" });
    expect(link).toHaveAttribute("href", "https://app.lemonsqueezy.com/my-orders/receipt-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("an invoice with no receiptUrl (webhook never carried one) shows a plain unavailable marker, never a dead/broken link", () => {
    render(<InvoiceHistoryTable invoices={[invoiceFixture({ receiptUrl: null })]} lang="EN" />);

    expect(screen.queryByRole("link", { name: "View receipt" })).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("a failed invoice renders its real status distinctly (muted/italic), not a colored chip", () => {
    render(<InvoiceHistoryTable invoices={[invoiceFixture({ status: "failed", receiptUrl: null })]} lang="EN" />);

    const statusCell = screen.getByText("Failed");
    expect(statusCell.className).toMatch(/statusFailed/);
  });

  it("a refunded invoice renders the real 'Refunded' label", () => {
    render(<InvoiceHistoryTable invoices={[invoiceFixture({ status: "refunded" })]} lang="EN" />);

    expect(screen.getByText("Refunded")).toBeInTheDocument();
  });

  it("an unrecognized status string still renders honestly (the raw value), rather than crashing or silently dropping the row", () => {
    render(<InvoiceHistoryTable invoices={[invoiceFixture({ status: "chargeback" })]} lang="EN" />);

    expect(screen.getByText("chargeback")).toBeInTheDocument();
  });

  it("renders nothing at all for an empty invoice list, rather than an empty table shell", () => {
    const { container } = render(<InvoiceHistoryTable invoices={[]} lang="EN" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("multiple invoices each render their own row, in the order given (already newest-first from the real endpoint)", () => {
    render(
      <InvoiceHistoryTable
        invoices={[
          invoiceFixture({ id: "row-1", amount: 4000 }),
          invoiceFixture({ id: "row-2", amount: 2000, status: "refunded" }),
        ]}
        lang="EN"
      />,
    );

    const rows = screen.getAllByRole("row");
    // header row + 2 data rows
    expect(rows).toHaveLength(3);
    expect(screen.getByText("$40.00")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
  });
});
