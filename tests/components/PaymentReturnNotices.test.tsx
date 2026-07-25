import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillingReturnContent } from "@/components/app/billing/BillingReturnContent";
import { PaymentCancelContent } from "@/components/app/billing/PaymentCancelContent";

describe("PaymentCancelContent", () => {
  it("renders no-blame copy with real working links back to pricing and dashboard — no server call, nothing to (mis)report", () => {
    render(<PaymentCancelContent />);

    expect(screen.getByRole("heading", { name: "This checkout wasn't completed." })).toBeInTheDocument();
    expect(screen.getByText("Nothing was charged.", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to pricing" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("never claims anything about the user's overall plan state — no 'active'/'confirmed' language anywhere", () => {
    render(<PaymentCancelContent />);

    expect(screen.queryByText(/is active/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/confirmed/i)).not.toBeInTheDocument();
  });
});

describe("BillingReturnContent", () => {
  it("renders its preserved LEGACY content honestly, with real working links, even though this route is dormant in the current backend", () => {
    render(<BillingReturnContent />);

    expect(screen.getByRole("heading", { name: "Checkout completed." })).toBeInTheDocument();
    expect(screen.getByText(/verified confirmation/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "View pricing" })).toHaveAttribute("href", "/pricing");
  });
});
