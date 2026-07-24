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

/**
 * jsdom has no real `Worker` — `new Worker(...)` throws outright unless
 * stubbed. Every 032 test avoided this by only ever exercising the
 * pre-parse rejection paths. This prompt (033) needs to drive the worker
 * to a real "result" message to reach the stage-rail/cancel/duplicate/
 * retry states, so a minimal controllable stand-in is stubbed in per
 * test via `vi.stubGlobal("Worker", MockWorker)`.
 */
class MockWorker {
  static instances: MockWorker[] = [];
  onmessage: ((event: { data: Record<string, unknown> }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminated = false;
  lastMessage: { requestId: string } | null = null;
  constructor(_url: string | URL) {
    MockWorker.instances.push(this);
  }
  postMessage(message: { requestId: string }) {
    this.lastMessage = message;
  }
  terminate() {
    this.terminated = true;
  }
}

async function uploadAndGetWorker(file = new File(["hello"], "chat.json", { type: "application/json" })) {
  MockWorker.instances = [];
  vi.stubGlobal("Worker", MockWorker as unknown as typeof Worker);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file);
  return waitFor(() => {
    const instance = MockWorker.instances.at(-1);
    if (!instance) throw new Error("worker was never constructed");
    return instance;
  });
}

function respondWorkerOk(worker: MockWorker, conversationCount = 1) {
  worker.onmessage?.({
    data: {
      requestId: worker.lastMessage?.requestId,
      ok: true,
      conversations: Array.from({ length: conversationCount }, (_, index) => ({
        externalId: String(index),
        participantSummary: [],
        messages: [{ senderType: "user", content: "hi", sentAt: "2026-07-20T10:00:00.000Z" }],
      })),
      preview: [],
      parserVersion: "test-v1",
      detectedFormat: "json",
      warnings: [],
    },
  });
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

  it("cancel during parsing terminates the worker for real and lands on the designed cancelled state with a restart action", async () => {
    render(<ImportFlow />);
    await screen.findByText(/free/);
    await checkConsent();

    const worker = await uploadAndGetWorker();
    await userEvent.click(await screen.findByRole("button", { name: /Cancel local parsing/ }));

    expect(worker.terminated).toBe(true);
    expect(await screen.findByText(/Import cancelled/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry safely/ })).toBeInTheDocument();
    // Cancel is only ever meaningful during parse/save — once terminal, it disappears.
    expect(screen.queryByRole("button", { name: /Cancel local parsing/ })).not.toBeInTheDocument();
  });

  it("stage rail progresses through parsing and saving to a real, non-fabricated done count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/imports" && !init) return { ok: true, json: async () => ({ imports: [], planId: "free", limits }) };
        if (url === "/api/imports" && init?.method === "POST") {
          return { ok: true, json: async () => ({ import: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }, planId: "free" }) };
        }
        if (url.endsWith("/chunks")) return { ok: true, json: async () => ({ ok: true }) };
        if (url.endsWith("/extract")) return { ok: true, json: async () => ({ done: true, created: 4 }) };
        throw new Error(`unexpected fetch: ${url}`);
      }),
    );

    render(<ImportFlow />);
    await screen.findByText(/free/);
    await checkConsent();

    const worker = await uploadAndGetWorker();
    respondWorkerOk(worker);

    expect(await screen.findByText(/4 memories saved\./, {}, { timeout: 3000 })).toBeInTheDocument();
    // Every named stage rendered along the way — no invented percentages.
    expect(screen.getByText("Parsing")).toBeInTheDocument();
    expect(screen.getByText("Saving")).toBeInTheDocument();
    expect(screen.getByText("Extracting memories")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("duplicate 409 renders the designed resolution panel end-to-end, never a raw error string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/imports" && !init) return { ok: true, json: async () => ({ imports: [], planId: "free", limits }) };
        if (url === "/api/imports" && init?.method === "POST") {
          return {
            ok: false,
            json: async () => ({
              error: "DUPLICATE_IMPORT",
              import: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", status: "completed", created_at: "2026-07-20T10:00:00.000Z" },
            }),
          };
        }
        throw new Error(`unexpected fetch: ${url}`);
      }),
    );

    render(<ImportFlow />);
    await screen.findByText(/free/);
    await checkConsent();

    const worker = await uploadAndGetWorker();
    respondWorkerOk(worker);

    expect(await screen.findByText("This file was already imported")).toBeInTheDocument();
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View status on dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Is this actually a different file?")).toBeInTheDocument();
    expect(screen.queryByText("DUPLICATE_IMPORT")).not.toBeInTheDocument();
  });

  it("extraction pause (monthly memory limit) offers a retry that resumes via the extract endpoint's cursor, never re-uploading", async () => {
    let createCalls = 0;
    let chunkCalls = 0;
    let extractCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/imports" && !init) return { ok: true, json: async () => ({ imports: [], planId: "free", limits }) };
        if (url === "/api/imports" && init?.method === "POST") {
          createCalls += 1;
          return { ok: true, json: async () => ({ import: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }, planId: "free" }) };
        }
        if (url.endsWith("/chunks")) {
          chunkCalls += 1;
          return { ok: true, json: async () => ({ ok: true }) };
        }
        if (url.endsWith("/extract")) {
          extractCalls += 1;
          if (extractCalls === 1) return { ok: false, json: async () => ({ error: "MEMORY_LIMIT_REACHED" }) };
          return { ok: true, json: async () => ({ done: true, created: 2 }) };
        }
        throw new Error(`unexpected fetch: ${url}`);
      }),
    );

    render(<ImportFlow />);
    await screen.findByText(/free/);
    await checkConsent();

    const worker = await uploadAndGetWorker();
    respondWorkerOk(worker);

    expect(await screen.findByText(/monthly memory limit/, {}, { timeout: 3000 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry memory extraction" }));

    expect(await screen.findByText(/2 memories saved\./)).toBeInTheDocument();
    expect(createCalls).toBe(1);
    expect(chunkCalls).toBe(1);
    expect(extractCalls).toBe(2);
  });
});
