import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExportSection } from "@/components/app/privacy/ExportSection";

afterEach(() => {
  vi.unstubAllGlobals();
});

function deferredFetch() {
  let resolve!: (value: { ok: boolean; status?: number; headers: Headers; blob: () => Promise<Blob> }) => void;
  const promise = new Promise((res) => {
    resolve = res;
  });
  vi.stubGlobal("fetch", vi.fn(() => promise));
  return { resolve };
}

describe("ExportSection", () => {
  it("shows a real pending state while the export request is in flight, and disables both buttons (single in-flight, per this prompt's own edge case)", async () => {
    const { resolve } = deferredFetch();
    render(<ExportSection lang="EN" />);

    await userEvent.click(screen.getByRole("button", { name: /Export JSON/ }));
    expect(screen.getByText("Preparing your export…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export JSON/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Export CSV ZIP/ })).toBeDisabled();

    resolve({ ok: true, headers: new Headers({ "content-disposition": 'attachment; filename="altr-export-2026-07-25.json"' }), blob: async () => new Blob(["{}"]) });
    await vi.waitFor(() => expect(screen.queryByText("Preparing your export…")).not.toBeInTheDocument());
  });

  it("a double-click while already exporting never issues a second fetch", async () => {
    const { resolve } = deferredFetch();
    render(<ExportSection lang="EN" />);
    const button = screen.getByRole("button", { name: /Export JSON/ });
    await userEvent.click(button);
    await userEvent.click(button);

    expect(fetch).toHaveBeenCalledTimes(1);
    resolve({ ok: true, headers: new Headers(), blob: async () => new Blob(["{}"]) });
  });

  it("a 429 shows the rate-limit message, not the generic failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 429, headers: new Headers(), blob: async () => new Blob() })));
    render(<ExportSection lang="EN" />);
    await userEvent.click(screen.getByRole("button", { name: /Export CSV ZIP/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many export requests");
  });

  it("a generic failure shows the honest error state, not a crash", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, headers: new Headers(), blob: async () => new Blob() })));
    render(<ExportSection lang="EN" />);
    await userEvent.click(screen.getByRole("button", { name: /Export JSON/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't create your export");
  });
});
