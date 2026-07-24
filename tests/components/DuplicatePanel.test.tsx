import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DuplicatePanel } from "@/components/app/imports/DuplicatePanel";

describe("DuplicatePanel", () => {
  it("shows only the real fields the 409 response actually returns — existing status and date, no fabricated detail", () => {
    render(<DuplicatePanel existing={{ id: "1", status: "completed", createdAt: "2026-07-20T10:00:00.000Z" }} lang="EN" />);
    expect(screen.getByText("This file was already imported")).toBeInTheDocument();
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
  });

  it("links to the real history section now that one exists (034) — Prompt 035 retargeted this from the interim /dashboard link", () => {
    render(<DuplicatePanel existing={{ id: "1", status: "processing", createdAt: "2026-07-20T10:00:00.000Z" }} lang="EN" />);
    expect(screen.getByRole("link", { name: "View status in history" })).toHaveAttribute("href", "/import-conversations#import-history");
    expect(screen.getByText(/Processing/)).toBeInTheDocument();
  });

  it("offers the 'different file' re-export guidance, not just a dead end", () => {
    render(<DuplicatePanel existing={{ id: "1", status: "completed", createdAt: "2026-07-20T10:00:00.000Z" }} lang="EN" />);
    expect(screen.getByText("Is this actually a different file?")).toBeInTheDocument();
    expect(screen.getByText(/generate a fresh one from the source platform/)).toBeInTheDocument();
  });
});
