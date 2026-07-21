import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { MemoryDemo } from "@/components/site/MemoryDemo";
import { memoryDemoCopy } from "@/lib/i18n/home-copy";

beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = IntersectionObserverStub;
});

describe("MemoryDemo", () => {
  it("renders the #memory section with all fictional memories (category, title, description, provenance)", () => {
    render(<MemoryDemo />);

    expect(document.getElementById("memory")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: memoryDemoCopy.EN.title })).toBeInTheDocument();
    for (const memory of memoryDemoCopy.EN.memories) {
      expect(screen.getByText(memory.title)).toBeInTheDocument();
      expect(screen.getByText(memory.description)).toBeInTheDocument();
      // category/provenance repeat across fictional memories (e.g. two
      // memories both sourced from the same Telegram export) — assert
      // presence, not uniqueness.
      expect(screen.getAllByText(memory.category).length).toBeGreaterThan(0);
      expect(screen.getAllByText(memory.provenance).length).toBeGreaterThan(0);
    }
  });

  it("renders exactly one memory in an editing state, with no real interactive controls anywhere in the list", () => {
    render(<MemoryDemo />);

    expect(screen.getAllByText(memoryDemoCopy.EN.editingLabel)).toHaveLength(1);
    // "No dead buttons" — the editing affordance is decorative text/
    // styling only, never a <button>, <input>, or anything with an
    // interactive ARIA role that would falsely promise it does something.
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(document.querySelector("input")).toBeNull();
  });
});
