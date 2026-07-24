import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImportHistory } from "@/components/app/imports/ImportHistory";

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    platform: "telegram",
    source_name: "chat-export.json",
    bytes: 204_800,
    status: "completed",
    conversations: 3,
    messages: 42,
    preview: [],
    parser_version: "altr-browser-parser-2",
    mime_type: "application/json",
    file_extension: "json",
    raw_file_stored: false,
    created_at: "2026-07-20T10:00:00.000Z",
    completed_at: "2026-07-20T10:01:00.000Z",
    error: null,
    extraction_status: "completed",
    extraction_error: null,
    extraction_cursor: 42,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ImportHistory", () => {
  it("shows a designed empty state when there are no real imports, not a bare blank area", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ imports: [] }) })));
    render(<ImportHistory />);
    expect(await screen.findByText("Nothing imported yet")).toBeInTheDocument();
  });

  it("renders real rows from the API, newest first as returned, and never shows deleted rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ imports: [row({ id: "a", source_name: "first.json" }), row({ id: "b", source_name: "removed.json", status: "deleted" })] }),
      })),
    );
    render(<ImportHistory />);
    expect(await screen.findByText("first.json")).toBeInTheDocument();
    expect(screen.queryByText("removed.json")).not.toBeInTheDocument();
  });

  it("shows the 100-row cap note only when the real response is actually at the cap", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ imports: Array.from({ length: 100 }, (_, i) => row({ id: String(i) })) }) })),
    );
    render(<ImportHistory />);
    expect(await screen.findByText("Showing your most recent 100 imports.")).toBeInTheDocument();
  });

  it("does not show the cap note for a normal-sized history", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ imports: [row()] }) })));
    render(<ImportHistory />);
    await screen.findByText("chat-export.json");
    expect(screen.queryByText(/Showing your most recent/)).not.toBeInTheDocument();
  });

  it("shows a calm load-failure message when the history request itself fails, not a crash", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ error: "IMPORT_LIST_FAILED" }) })));
    render(<ImportHistory />);
    expect(await screen.findByText("Could not load your import history.")).toBeInTheDocument();
  });
});
