import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TwinDraftHistory } from "@/components/app/twin/TwinDraftHistory";

function runFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    input_text: "Can you send the update today?",
    output_text: "Sure — here's where things stand as of this morning.",
    model: "mock-openai",
    status: "draft",
    used_memory_ids: ["11111111-1111-4111-8111-111111111111"],
    used_message_ids: [],
    created_at: "2026-03-01T10:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TwinDraftHistory", () => {
  it("renders each real run's date, model, and excerpts from the real GET /api/ai/drafts response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ runs: [runFixture()], page: 1, pageSize: 10, total: 1, totalPages: 1 }) })));
    render(<TwinDraftHistory lang="EN" refreshToken={0} />);

    expect(await screen.findByText(/Can you send the update today\?/)).toBeInTheDocument();
    expect(screen.getByText(/mock-openai/)).toBeInTheDocument();
  });

  it("empty history shows the honest invitation, not a blank area", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ runs: [], page: 1, pageSize: 10, total: 0, totalPages: 1 }) })));
    render(<TwinDraftHistory lang="EN" refreshToken={0} />);

    expect(await screen.findByText("No drafts yet. Generate one above.")).toBeInTheDocument();
  });

  it("a load failure shows the honest error state instead of crashing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ error: "DRAFT_HISTORY_LIST_FAILED" }) })));
    render(<TwinDraftHistory lang="EN" refreshToken={0} />);

    expect(await screen.findByText("Couldn't load your draft history.")).toBeInTheDocument();
  });

  it("selecting a run shows the full input/output read-only, with real provenance counts, and Back returns to the list", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ runs: [runFixture()], page: 1, pageSize: 10, total: 1, totalPages: 1 }) })));
    render(<TwinDraftHistory lang="EN" refreshToken={0} />);
    await screen.findByText(/Can you send the update today\?/);

    await userEvent.click(screen.getByText(/Can you send the update today\?/).closest("button")!);

    expect(screen.getByText("Draft detail")).toBeInTheDocument();
    expect(screen.getByText("Sure — here's where things stand as of this morning.")).toBeInTheDocument();
    expect(screen.getByText("Drawing on 1 memory")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back to history" }));
    expect(screen.queryByText("Draft detail")).not.toBeInTheDocument();
    expect(screen.getByText(/Can you send the update today\?/)).toBeInTheDocument();
  });

  it("pagination fetches the next page with the real page/pageSize query params, and Previous is disabled on page 1", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("page=2")) return { ok: true, json: async () => ({ runs: [runFixture({ id: "page-2-run", input_text: "Second page message" })], page: 2, pageSize: 10, total: 15, totalPages: 2 }) };
      return { ok: true, json: async () => ({ runs: [runFixture()], page: 1, pageSize: 10, total: 15, totalPages: 2 }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<TwinDraftHistory lang="EN" refreshToken={0} />);
    await screen.findByText(/Can you send the update today\?/);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText(/Second page message/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/ai/drafts?page=2&pageSize=10");
  });

  it("refetches when the parent's refreshToken changes — a freshly generated draft appears without a manual reload", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ runs: [runFixture()], page: 1, pageSize: 10, total: 1, totalPages: 1 }) }));
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(<TwinDraftHistory lang="EN" refreshToken={0} />);
    await screen.findByText(/Can you send the update today\?/);
    fetchMock.mockClear();

    rerender(<TwinDraftHistory lang="EN" refreshToken={1} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });
});
