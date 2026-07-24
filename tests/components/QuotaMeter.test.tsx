import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuotaMeter } from "@/components/app/QuotaMeter";

describe("QuotaMeter", () => {
  it("normal state: shows the real used/limit numbers and a plain progressbar, no near-limit or reached note", () => {
    render(<QuotaMeter label="Memory" used={40} limit={250} lang="EN" />);

    expect(screen.getByText("40 / 250")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar", { name: "Memory" });
    expect(bar).toHaveAttribute("aria-valuenow", "16");
    expect(screen.queryByText("Nearing your plan's limit.")).not.toBeInTheDocument();
    expect(screen.queryByText("Limit reached.")).not.toBeInTheDocument();
  });

  it("near-limit state (>=80%): shows the nearing-limit note but no upgrade link yet", () => {
    render(<QuotaMeter label="Drafts" used={8} limit={10} lang="EN" />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "80");
    expect(screen.getByText("Nearing your plan's limit.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Upgrade plan" })).not.toBeInTheDocument();
  });

  it("reached state (100%): shows the reached note with a real upgrade link to /pricing, and never exceeds 100 even over quota", () => {
    render(<QuotaMeter label="Drafts" used={14} limit={10} lang="EN" />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("Limit reached.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute("href", "/pricing");
  });

  it("unknown state (query failed): shows a quiet dash instead of a misleading zero, and no progressbar at all", () => {
    render(<QuotaMeter ariaLabel="Twin" used={0} limit={10} lang="EN" unknown />);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Unavailable right now.")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders no visible label when omitted, but still keeps an accessible name via ariaLabel", () => {
    render(<QuotaMeter ariaLabel="Memory" used={5} limit={250} lang="EN" />);

    expect(screen.getByRole("progressbar", { name: "Memory" })).toBeInTheDocument();
  });
});
