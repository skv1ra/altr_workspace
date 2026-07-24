import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryEditDialog } from "@/components/app/memory/MemoryEditDialog";
import type { Memory } from "@/components/app/memory/MemoryOverview";

const memory: Memory = {
  id: "11111111-1111-4111-8111-111111111111",
  category: "communication_style",
  title: "Short, direct replies",
  description: "Keeps replies concise.",
  confidence: 0.5,
  source_type: "manual",
  source_reference: "manual:user",
  is_active: true,
  created_at: "2026-03-15T10:00:00.000Z",
  updated_at: "2026-03-15T10:00:00.000Z",
  extraction_model: null,
  extraction_version: "manual-v1",
  altr_memory_sources: [],
};

function noop() {}

describe("MemoryEditDialog", () => {
  it("mirrors the real server schema's exact limits — title 180, category 80, description 4000 — as maxLength, with a live count", () => {
    render(<MemoryEditDialog state={{ mode: "create" }} lang="EN" saving={false} categoryOptions={[]} goneError={false} onCancel={noop} onSave={noop} />);
    expect(screen.getByLabelText(/Title/)).toHaveAttribute("maxLength", "180");
    expect(screen.getByLabelText(/Category/)).toHaveAttribute("maxLength", "80");
    expect(screen.getByLabelText(/Description/)).toHaveAttribute("maxLength", "4000");
    expect(screen.getByText("0/180")).toBeInTheDocument();
    expect(screen.getByText("0/4000")).toBeInTheDocument();
  });

  it("the live character count updates as the real server-schema-mirroring limit approaches, not a static label", async () => {
    render(<MemoryEditDialog state={{ mode: "create" }} lang="EN" saving={false} categoryOptions={[]} goneError={false} onCancel={noop} onSave={noop} />);
    await userEvent.type(screen.getByLabelText(/Title/), "A new memory title");
    expect(screen.getByText("18/180")).toBeInTheDocument();
  });

  it("offers real existing categories as combobox suggestions, but still accepts free entry (not a fixed enum)", () => {
    render(
      <MemoryEditDialog
        state={{ mode: "create" }}
        lang="EN"
        saving={false}
        categoryOptions={["communication_style", "people"]}
        goneError={false}
        onCancel={noop}
        onSave={noop}
      />,
    );
    const input = screen.getByLabelText(/Category/) as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input).not.toHaveAttribute("readonly");
    const options = document.querySelectorAll("datalist option");
    expect(Array.from(options).map((option) => option.getAttribute("value"))).toEqual(["communication_style", "people"]);
  });

  it("create mode and edit mode show distinct real titles, and edit mode prefills the real memory's own values", () => {
    const { rerender } = render(<MemoryEditDialog state={{ mode: "create" }} lang="EN" saving={false} categoryOptions={[]} goneError={false} onCancel={noop} onSave={noop} />);
    expect(screen.getByRole("heading", { name: "Add a memory" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toHaveValue("");

    rerender(<MemoryEditDialog state={{ mode: "edit", memory }} lang="EN" saving={false} categoryOptions={[]} goneError={false} onCancel={noop} onSave={noop} />);
    expect(screen.getByRole("heading", { name: "Edit memory" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toHaveValue("Short, direct replies");
  });

  it("save is blocked (no onSave call) when a required field is only whitespace", async () => {
    const onSave = vi.fn();
    render(<MemoryEditDialog state={{ mode: "create" }} lang="EN" saving={false} categoryOptions={[]} goneError={false} onCancel={noop} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText(/Title/), "   ");
    await userEvent.type(screen.getByLabelText(/Category/), "people");
    await userEvent.type(screen.getByLabelText(/Description/), "A real description.");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("the 'editing a memory deleted in another tab' edge case shows a designed gone-state, not the form or a raw error", () => {
    render(<MemoryEditDialog state={{ mode: "edit", memory }} lang="EN" saving={false} categoryOptions={[]} goneError onCancel={noop} onSave={noop} />);
    expect(screen.getByText("This memory no longer exists.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Title/)).not.toBeInTheDocument();
  });
});
