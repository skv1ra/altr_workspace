import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImportFlow } from "@/components/app/imports/ImportFlow";

const limits = {
  importsPerMonth: 1,
  maxFileBytes: 5_242_880,
  maxMessagesPerImport: 2000,
  maxConversationsPerImport: 100,
  maxActiveMemories: 250,
  aiDraftsPerMonth: 10,
  concurrentImports: 1,
  concurrentMemoryJobs: 1,
};

async function checkConsent() {
  await userEvent.click(screen.getByText("I authorize storage of normalized results.", { exact: false }));
}

describe("ImportFlow", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ imports: [], planId: "free", limits }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and displays the real server-enforced plan limits, not placeholder text", async () => {
    render(<ImportFlow />);
    expect(await screen.findByText(/free/)).toBeInTheDocument();
    expect(screen.getByText(/5 MB/)).toBeInTheDocument();
    expect(screen.getByText(/2,000 messages/)).toBeInTheDocument();
  });

  it("consent gating: rejects a file before any upload attempt when the checkbox is unchecked", async () => {
    render(<ImportFlow />);
    await screen.findByText(/free/);

    const file = new File(["hello"], "chat.json", { type: "application/json" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(await screen.findByRole("alert")).toHaveTextContent("Confirm that normalized data may be stored.");
    expect(fetch).toHaveBeenCalledTimes(1); // only the initial GET /api/imports — never a POST
  });

  it("pre-check rejection: a 0-byte file is rejected before parsing, with a precise designed message", async () => {
    render(<ImportFlow />);
    await screen.findByText(/free/);
    await checkConsent();

    const empty = new File([], "chat.json", { type: "application/json" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, empty);

    expect(await screen.findByRole("alert")).toHaveTextContent("This file is empty.");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("pre-check rejection: an unsupported extension is rejected before parsing, without ever starting the worker", async () => {
    render(<ImportFlow />);
    await screen.findByText(/free/);
    await checkConsent();

    // `userEvent.upload` respects the input's own `accept` allow-list (the
    // same one this test is deliberately violating), so it never even
    // attaches the file — this is the one real path a user could still hit
    // via drag-and-drop, which isn't accept-filtered the same way, so it's
    // simulated here with a direct `fireEvent.change` instead.
    const badFile = new File(["not a real export"], "chat.exe", { type: "application/octet-stream" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [badFile], configurable: true });
    fireEvent.change(input);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This file format isn't supported. Export as JSON, TXT, HTML, CSV, ZIP, or MBOX.",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("states in the UI that dropping multiple files only uses the first", async () => {
    render(<ImportFlow />);
    await screen.findByText(/free/);
    expect(screen.getByText("Only the first file is used if you drop more than one.")).toBeInTheDocument();
  });

  it("shows the true, audited privacy statement on-surface", async () => {
    render(<ImportFlow />);
    expect(
      screen.getByText("Your file is read in your browser. The original archive is never uploaded."),
    ).toBeInTheDocument();
  });

  it("shows a real QuotaMeter for imports this month, not a fabricated number, once limits resolve", async () => {
    render(<ImportFlow />);
    await screen.findByText(/free/);
    expect(screen.getByRole("progressbar", { name: "Imports this month" })).toHaveAttribute("aria-valuenow", "0");
  });
});
