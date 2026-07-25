import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryOverview } from "@/components/app/memory/MemoryOverview";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/memory",
}));

const preferences = { learning: true, autoDrafts: true, weeklyDigest: false, privacyMode: true };
const connections = { email: false, calendar: false, messages: true, workspace: false };

const defaultProps = {
  initialQuery: "",
  initialCategory: "",
  initialPage: 1,
  categoryCounts: [
    { category: "communication_style", count: 2 },
    { category: "people", count: 1 },
  ],
  totalMemories: 3,
  activeMemoryCount: 3,
  memoryLimit: 250,
  learningEnabled: true,
  connections,
  preferences,
};

function memoryFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    category: "communication_style",
    title: "Short, direct replies",
    description: "Keeps replies concise.",
    confidence: 0.8,
    source_type: "manual",
    source_reference: "manual:user",
    is_active: true,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    extraction_model: null,
    extraction_version: "manual-v1",
    altr_memory_sources: [],
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockClear();
});

describe("MemoryOverview", () => {
  it("no memories at all: shows the designed 'no memories yet' invitation, not the filtered empty state", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ memories: [], total: 0, totalPages: 1 }) })));
    render(<MemoryOverview {...defaultProps} totalMemories={0} categoryCounts={[]} />);

    expect(await screen.findByText("No memories yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Import conversations" })).toHaveAttribute("href", "/import-conversations");
    expect(screen.queryByText("No memories match this view")).not.toBeInTheDocument();
  });

  it("has memories overall but the current filter matches none: shows the filtered empty state with a real clear-filters action", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ memories: [], total: 0, totalPages: 1 }) })));
    render(<MemoryOverview {...defaultProps} initialCategory="people" />);

    expect(await screen.findByText("No memories match this view")).toBeInTheDocument();
    expect(screen.queryByText("No memories yet")).not.toBeInTheDocument();

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = new URL(fetchMock.mock.calls[0][0] as string, "http://localhost");
    expect(url.searchParams.get("category")).toBeNull();
    expect(url.searchParams.get("q")).toBeNull();
  });

  it("debounces search: typing does not fetch immediately, only after the debounce window settles", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ memories: [memoryFixture()], total: 1, totalPages: 1 }) })));
    render(<MemoryOverview {...defaultProps} />);
    await screen.findByText("Short, direct replies");

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    const input = screen.getByLabelText("Search memories");
    await userEvent.type(input, "phrase");

    // Still well within the debounce window — no new fetch yet.
    expect(fetchMock).not.toHaveBeenCalled();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 2000 });
    const url = new URL(fetchMock.mock.calls[0][0] as string, "http://localhost");
    expect(url.searchParams.get("q")).toBe("phrase");
  });

  it("clicking a category tab re-fetches with the real category, and syncs the URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ memories: [memoryFixture()], total: 1, totalPages: 1 }) })));
    render(<MemoryOverview {...defaultProps} />);
    await screen.findByText("Short, direct replies");

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    await userEvent.click(screen.getByRole("tab", { name: /people/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = new URL(fetchMock.mock.calls[0][0] as string, "http://localhost");
    expect(url.searchParams.get("category")).toBe("people");
    await waitFor(() => expect(replace).toHaveBeenCalledWith(expect.stringContaining("category=people"), { scroll: false }));
  });

  it("page beyond range (URL-edited) clamps to the real last page reported by the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ memories: [memoryFixture()], total: 25, totalPages: 3 }) })),
    );
    render(<MemoryOverview {...defaultProps} initialPage={9} />);

    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    expect(screen.getByText(/of/)).toBeInTheDocument();
  });

  it("editing a memory saves via the real PATCH endpoint and refreshes the list", async () => {
    let title = "Short, direct replies";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.startsWith("/api/memories/") && init?.method === "PATCH") {
          title = JSON.parse(init.body as string).title;
          return { ok: true, json: async () => ({ memory: memoryFixture({ title }) }) };
        }
        return { ok: true, json: async () => ({ memories: [memoryFixture({ title })], total: 1, totalPages: 1 }) };
      }),
    );
    render(<MemoryOverview {...defaultProps} />);
    await screen.findByText("Short, direct replies");

    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = screen.getByRole("dialog");
    const titleInput = within(dialog).getByLabelText(/Title/);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated memory");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Updated memory")).toBeInTheDocument();
  });

  it("clear all calls the real bulk DELETE endpoint and lands on the 'no memories yet' state", async () => {
    let cleared = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/memories" && init?.method === "DELETE") {
          cleared = true;
          return { ok: true, json: async () => ({ ok: true }) };
        }
        return { ok: true, json: async () => ({ memories: cleared ? [] : [memoryFixture()], total: cleared ? 0 : 1, totalPages: 1 }) };
      }),
    );
    render(<MemoryOverview {...defaultProps} />);
    await screen.findByText("Short, direct replies");

    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    const dialog = screen.getByRole("dialog");
    // Typed confirmation gate (037's own "stricter than window.confirm,
    // satisfying invariant #8" instruction) — the confirm button stays
    // disabled until the exact phrase is typed.
    const confirmButton = within(dialog).getByRole("button", { name: "Clear all" });
    expect(confirmButton).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/DELETE ALL MEMORIES/), "DELETE ALL MEMORIES");
    expect(confirmButton).toBeEnabled();
    await userEvent.click(confirmButton);

    expect(await screen.findByText("No memories yet")).toBeInTheDocument();
  });

  it("enable/disable calls the real PATCH endpoint with the real active flag", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.startsWith("/api/memories/") && init?.method === "PATCH") return { ok: true, json: async () => ({ memory: memoryFixture() }) };
        return { ok: true, json: async () => ({ memories: [memoryFixture()], total: 1, totalPages: 1 }) };
      }),
    );
    render(<MemoryOverview {...defaultProps} />);
    await screen.findByText("Short, direct replies");

    const fetchMock = vi.mocked(fetch);
    await userEvent.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/memories/${memoryFixture().id}`,
        expect.objectContaining({ method: "PATCH", body: JSON.stringify({ active: false }) }),
      ),
    );
  });

  it("New memory opens the same editor in create mode and saves via the real POST endpoint, not PATCH", async () => {
    let createBody: unknown = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/memories" && init?.method === "POST") {
          createBody = JSON.parse(init.body as string);
          return { ok: true, json: async () => ({ memory: memoryFixture() }) };
        }
        return { ok: true, json: async () => ({ memories: createBody ? [memoryFixture()] : [], total: createBody ? 1 : 0, totalPages: 1 }) };
      }),
    );
    render(<MemoryOverview {...defaultProps} totalMemories={0} categoryCounts={[]} />);
    await screen.findByText("No memories yet");

    await userEvent.click(screen.getByRole("button", { name: /New memory/ }));
    expect(screen.getByRole("heading", { name: "Add a memory" })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Title/), "A brand new memory");
    await userEvent.type(screen.getByLabelText(/Category/), "people");
    await userEvent.type(screen.getByLabelText(/Description/), "Added straight from the editor.");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(createBody).toMatchObject({ title: "A brand new memory", category: "people" }));
    expect(await screen.findByText("Short, direct replies")).toBeInTheDocument();
  });

  it("New memory button always stays clickable at quota, but the dialog it opens shows the reached notice and disables Save (never blocks opening/viewing)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ memories: [memoryFixture()], total: 1, totalPages: 1 }) })));
    render(<MemoryOverview {...defaultProps} activeMemoryCount={250} memoryLimit={250} />);
    await screen.findByText("Short, direct replies");

    const newMemoryButton = screen.getByRole("button", { name: /New memory/ });
    expect(newMemoryButton).toBeEnabled();
    await userEvent.click(newMemoryButton);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("You've reached your active memory limit.")).toBeInTheDocument();
    expect(within(dialog).getByText(/250\/250/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Upgrade plan" })).toHaveAttribute("href", "/pricing");
    expect(within(dialog).getByRole("button", { name: "Save changes" })).toBeDisabled();

    // Editing the already-listed memory is completely unaffected by the
    // create-only gate above — this prompt's own "never blocks
    // viewing/editing" requirement.
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.queryByText("You've reached your active memory limit.")).not.toBeInTheDocument();
  });

  it("the header meter and the create dialog's own quota check both update live after a real create, without a full page reload", async () => {
    let createCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/memories" && init?.method === "POST") {
          createCalls += 1;
          return { ok: true, json: async () => ({ memory: memoryFixture({ id: "22222222-2222-4222-8222-222222222222", title: "Second memory" }) }) };
        }
        return {
          ok: true,
          json: async () => ({
            memories: createCalls > 0 ? [memoryFixture(), memoryFixture({ id: "22222222-2222-4222-8222-222222222222", title: "Second memory" })] : [memoryFixture()],
            total: createCalls > 0 ? 2 : 1,
            totalPages: 1,
          }),
        };
      }),
    );
    // One below the limit: the real create should push it exactly to the
    // limit, and a second dialog open right after must show the reached
    // notice from local state alone — no extra network round trip needed.
    render(<MemoryOverview {...defaultProps} activeMemoryCount={1} memoryLimit={2} />);
    await screen.findByText("Short, direct replies");

    expect(screen.getByRole("progressbar", { name: "Active memories" })).toHaveAttribute("aria-valuenow", "50");

    await userEvent.click(screen.getByRole("button", { name: /New memory/ }));
    await userEvent.type(screen.getByLabelText(/Title/), "Second memory");
    await userEvent.type(screen.getByLabelText(/Category/), "people");
    await userEvent.type(screen.getByLabelText(/Description/), "Added straight from the editor.");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Second memory");

    expect(screen.getByRole("progressbar", { name: "Active memories" })).toHaveAttribute("aria-valuenow", "100");

    await userEvent.click(screen.getByRole("button", { name: /New memory/ }));
    expect(await screen.findByText("You've reached your active memory limit.")).toBeInTheDocument();
  });

  it("editing a memory deleted in another tab (the real 404) shows the designed gone-state and refreshes the list instead of throwing", async () => {
    let deleted = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.startsWith("/api/memories/") && init?.method === "PATCH") {
          deleted = true;
          return { ok: false, status: 404, json: async () => ({ error: "MEMORY_NOT_FOUND" }) };
        }
        return { ok: true, json: async () => ({ memories: deleted ? [] : [memoryFixture()], total: deleted ? 0 : 1, totalPages: 1 }) };
      }),
    );
    render(<MemoryOverview {...defaultProps} />);
    await screen.findByText("Short, direct replies");

    await userEvent.click(screen.getByRole("button", { name: /Edit/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("This memory no longer exists.")).toBeInTheDocument();
  });
});
