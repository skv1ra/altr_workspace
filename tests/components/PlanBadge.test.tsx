import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanBadge } from "@/components/app/PlanBadge";

describe("PlanBadge", () => {
  it("renders the real plan name from the server entitlement, in either language", () => {
    const { rerender } = render(<PlanBadge plan="personal" lang="EN" />);
    expect(screen.getByText("Personal")).toBeInTheDocument();

    rerender(<PlanBadge plan="personal" lang="UA" />);
    expect(screen.getByText("Особистий")).toBeInTheDocument();
  });

  it("renders each plan's own distinct label", () => {
    const { rerender } = render(<PlanBadge plan="free" lang="EN" />);
    expect(screen.getByText("Free")).toBeInTheDocument();

    rerender(<PlanBadge plan="work" lang="EN" />);
    expect(screen.getByText("Work")).toBeInTheDocument();
  });
});
