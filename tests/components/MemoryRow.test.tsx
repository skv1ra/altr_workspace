import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRow } from "@/components/app/memory/MemoryRow";
import type { Memory } from "@/components/app/memory/MemoryOverview";

const base: Memory = {
  id: "11111111-1111-4111-8111-111111111111",
  category: "communication_style",
  title: "Short, direct replies",
  description: "Keeps replies concise and avoids unnecessary wording.",
  confidence: 0.82,
  source_type: "message",
  source_reference: "message:1",
  is_active: true,
  created_at: "2026-03-15T10:00:00.000Z",
  updated_at: "2026-03-15T10:00:00.000Z",
  extraction_model: "gpt",
  extraction_version: "phase-7-v1",
  altr_memory_sources: [],
};

function noop() {}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MemoryRow", () => {
  it("renders the real fields — category, title, description, and a real (never platform-fabricated) provenance hint", () => {
    render(<MemoryRow memory={base} lang="EN" onEdit={noop} onOpenProvenance={noop} onToggleActive={noop} onDeleted={noop} togglingActive={false} />);
    expect(screen.getByText("communication_style")).toBeInTheDocument();
    expect(screen.getByText("Short, direct replies")).toBeInTheDocument();
    expect(screen.getByText(/Keeps replies concise/)).toBeInTheDocument();
    // source_type "message" (AI extraction) never claims a specific platform.
    expect(screen.getByText(/From an approved import · Mar 2026/)).toBeInTheDocument();
  });

  it("shows 'Manual entry' provenance for a manually-created memory, not an import claim", () => {
    render(
      <MemoryRow memory={{ ...base, source_type: "manual" }} lang="EN" onEdit={noop} onOpenProvenance={noop} onToggleActive={noop} onDeleted={noop} togglingActive={false} />,
    );
    expect(screen.getByText(/Manual entry · Mar 2026/)).toBeInTheDocument();
  });

  it("renders confidence as a raw 2-decimal number, not a percent badge — matches the design's own exact markup", () => {
    render(<MemoryRow memory={base} lang="EN" onEdit={noop} onOpenProvenance={noop} onToggleActive={noop} onDeleted={noop} togglingActive={false} />);
    expect(screen.queryByText("82%")).not.toBeInTheDocument();
    expect(screen.getByText("0.82")).toBeInTheDocument();
  });

  it("clamps long descriptions and expands in place on 'Show more'", async () => {
    const longDescription = "A".repeat(300);
    render(
      <MemoryRow memory={{ ...base, description: longDescription }} lang="EN" onEdit={noop} onOpenProvenance={noop} onToggleActive={noop} onDeleted={noop} togglingActive={false} />,
    );
    expect(screen.getByText(/A{240}…/)).toBeInTheDocument();
    expect(screen.queryByText(longDescription)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it("shows no status pill for an active memory (the design's own default state) and a Disabled pill for an inactive one", () => {
    const { rerender } = render(
      <MemoryRow memory={base} lang="EN" onEdit={noop} onOpenProvenance={noop} onToggleActive={noop} onDeleted={noop} togglingActive={false} />,
    );
    expect(screen.queryByText("Disabled")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument();
    expect(screen.queryByText(/never used by your Twin/)).not.toBeInTheDocument();

    rerender(
      <MemoryRow memory={{ ...base, is_active: false }} lang="EN" onEdit={noop} onOpenProvenance={noop} onToggleActive={noop} onDeleted={noop} togglingActive={false} />,
    );
    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument();
    // This prompt's own "clear semantics copy" instruction, literal text.
    expect(screen.getByText("Disabled memories are never used by your Twin.")).toBeInTheDocument();
  });

  it("Edit calls the onEdit callback directly (the parent owns the shared edit dialog)", async () => {
    const onEdit = vi.fn();
    render(<MemoryRow memory={base} lang="EN" onEdit={onEdit} onOpenProvenance={noop} onToggleActive={noop} onDeleted={noop} togglingActive={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("Provenance calls the onOpenProvenance callback directly (the parent owns the shared provenance dialog)", async () => {
    const onOpenProvenance = vi.fn();
    render(<MemoryRow memory={base} lang="EN" onEdit={noop} onOpenProvenance={onOpenProvenance} onToggleActive={noop} onDeleted={noop} togglingActive={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Provenance/ }));
    expect(onOpenProvenance).toHaveBeenCalledTimes(1);
  });

  it("delete confirm names the specific memory's title, never a generic 'this memory' — and calls the real DELETE endpoint only after confirming", async () => {
    const onDeleted = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
    render(<MemoryRow memory={base} lang="EN" onEdit={noop} onOpenProvenance={noop} onToggleActive={noop} onDeleted={onDeleted} togglingActive={false} />);

    await userEvent.click(screen.getByRole("button", { name: /Delete/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(`Delete "${base.title}"`)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(fetch).toHaveBeenCalledWith(`/api/memories/${base.id}`, { method: "DELETE" });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });
});
