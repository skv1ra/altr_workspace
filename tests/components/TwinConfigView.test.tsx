import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TwinConfigView } from "@/components/app/twin/TwinConfigView";

function twinFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    name: "My Altr",
    assistant_type: "digital_twin",
    system_instructions: "Keep it short.",
    tone: "balanced",
    is_active: true,
    config: { mode: "draft_only", version: 1 },
    ...overrides,
  };
}

const previews = [
  { id: "operator", name: "Operator", status: "coming_later" },
  { id: "negotiator", name: "Negotiator", status: "coming_later" },
];

function mockGet(twin: unknown, extraPreviews = previews) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/assistants" && (!init || !init.method)) {
      return { ok: true, json: async () => ({ assistants: twin ? [twin] : [], previews: extraPreviews }) };
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TwinConfigView", () => {
  it("loads the real Twin config from GET /api/assistants and prefills name/tone/instructions — no fabricated defaults", async () => {
    vi.stubGlobal("fetch", mockGet(twinFixture()));
    render(<TwinConfigView activeMemoryCount={12} />);

    expect(await screen.findByRole("heading", { name: "My Altr" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toHaveValue("My Altr");
    // Tone is a chip group (Altr App v3), not a <select> — the active
    // chip is the one whose real accessible state is pressed/active.
    expect(screen.getByRole("button", { name: "Balanced" })).toHaveAttribute("data-active", "true");
    expect(screen.getByLabelText(/Style instructions/)).toHaveValue("Keep it short.");
  });

  it("Save stays disabled until a real field changes, and editing then saving sends only the changed fields via PATCH", async () => {
    let patchBody: unknown = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/assistants" && (!init || !init.method)) {
          return { ok: true, json: async () => ({ assistants: [twinFixture()], previews }) };
        }
        if (url === `/api/assistants/${twinFixture().id}` && init?.method === "PATCH") {
          patchBody = JSON.parse(init.body as string);
          return { ok: true, json: async () => ({ assistant: twinFixture({ name: "Renamed Twin" }) }) };
        }
        throw new Error(`unexpected fetch: ${url} ${init?.method}`);
      }),
    );
    render(<TwinConfigView activeMemoryCount={0} />);
    await screen.findByLabelText(/Name/);

    const saveButton = screen.getByRole("button", { name: "Save changes" });
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByLabelText(/Name/);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Renamed Twin");
    expect(saveButton).toBeEnabled();

    await userEvent.click(saveButton);

    await waitFor(() => expect(patchBody).toEqual({ name: "Renamed Twin" }));
    expect(await screen.findByRole("heading", { name: "Renamed Twin" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled());
  });

  it("an empty name blocks Save with an inline error and never calls PATCH", async () => {
    const fetchMock = mockGet(twinFixture());
    vi.stubGlobal("fetch", fetchMock);
    render(<TwinConfigView activeMemoryCount={0} />);
    const nameInput = await screen.findByLabelText(/Name/);

    await userEvent.clear(nameInput);
    fetchMock.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Name can't be empty.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("a load failure (no digital_twin row, or a failed request) shows the honest error state instead of crashing or showing a fabricated default", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ assistants: [], previews: [] }) })));
    render(<TwinConfigView activeMemoryCount={0} />);

    expect(await screen.findByText("Couldn't load your Twin's configuration.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Name/)).not.toBeInTheDocument();
  });

  it("Status reflects the real server-side is_active value honestly — active case", async () => {
    vi.stubGlobal("fetch", mockGet(twinFixture({ is_active: true })));
    render(<TwinConfigView activeMemoryCount={0} />);

    await screen.findByLabelText(/Name/);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Your Twin can draft replies. Nothing is ever sent without you.")).toBeInTheDocument();
  });

  it("Status reflects the real server-side is_active value honestly — inactive case (not hardcoded to always show Active)", async () => {
    vi.stubGlobal("fetch", mockGet(twinFixture({ is_active: false })));
    render(<TwinConfigView activeMemoryCount={0} />);

    await screen.findByLabelText(/Name/);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Your Twin cannot draft replies until it's reactivated.")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("there is no active/inactive toggle control — Status is read-only, since the real PATCH contract has no writable field for it", async () => {
    vi.stubGlobal("fetch", mockGet(twinFixture()));
    render(<TwinConfigView activeMemoryCount={0} />);
    await screen.findByLabelText(/Name/);

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /active/i })).not.toBeInTheDocument();
  });

  it("the memory-linkage summary shows the real active-memory count and links to /memory, singular vs plural wording", async () => {
    vi.stubGlobal("fetch", mockGet(twinFixture()));
    const { rerender } = render(<TwinConfigView activeMemoryCount={1} />);
    await screen.findByLabelText(/Name/);
    expect(screen.getByText(/1 active memory ·/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View memory" })).toHaveAttribute("href", "/memory");

    vi.stubGlobal("fetch", mockGet(twinFixture()));
    rerender(<TwinConfigView activeMemoryCount={42} />);
    await waitFor(() => expect(screen.getByText(/42 active memories ·/)).toBeInTheDocument());
  });

  it("the real roadmap previews from GET /api/assistants render on this page", async () => {
    vi.stubGlobal("fetch", mockGet(twinFixture()));
    render(<TwinConfigView activeMemoryCount={0} />);
    await screen.findByLabelText(/Name/);

    expect(screen.getByText("Operator")).toBeInTheDocument();
    expect(screen.getByText("Negotiator")).toBeInTheDocument();
    expect(screen.getAllByText("In development")).toHaveLength(2);
  });

  it("the instructions field mirrors the real server schema's 3000-character limit as maxLength, with a live count (edge case: instructions at max length)", async () => {
    const longInstructions = "x".repeat(3000);
    vi.stubGlobal("fetch", mockGet(twinFixture({ system_instructions: longInstructions })));
    render(<TwinConfigView activeMemoryCount={0} />);

    const textarea = await screen.findByLabelText(/Style instructions/);
    expect(textarea).toHaveAttribute("maxLength", "3000");
    expect(textarea).toHaveValue(longInstructions);
    expect(screen.getByText(/3000\/3000/)).toBeInTheDocument();
  });

  it("an emoji Twin name round-trips through load, edit, and save without crashing or being stripped (edge case: emoji in Twin name)", async () => {
    let patchBody: unknown = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/assistants" && (!init || !init.method)) {
          return { ok: true, json: async () => ({ assistants: [twinFixture({ name: "🌙 Altr" })], previews }) };
        }
        if (url === `/api/assistants/${twinFixture().id}` && init?.method === "PATCH") {
          patchBody = JSON.parse(init.body as string);
          return { ok: true, json: async () => ({ assistant: twinFixture({ name: "🌙 Altr ✨" }) }) };
        }
        throw new Error(`unexpected fetch: ${url} ${init?.method}`);
      }),
    );
    render(<TwinConfigView activeMemoryCount={0} />);

    expect(await screen.findByRole("heading", { name: "🌙 Altr" })).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Name/);
    await userEvent.type(nameInput, " ✨");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(patchBody).toEqual({ name: "🌙 Altr ✨" }));
    expect(await screen.findByRole("heading", { name: "🌙 Altr ✨" })).toBeInTheDocument();
  });
});
