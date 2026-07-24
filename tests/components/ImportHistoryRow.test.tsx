import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImportHistoryRow } from "@/components/app/imports/ImportHistoryRow";
import type { ImportHistoryEntry } from "@/components/app/imports/ImportHistory";

const base: ImportHistoryEntry = {
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
};

function noop() {}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ImportHistoryRow", () => {
  it("completed row: shows the Completed status pill, source name, and counts — no resume button, delete only visible once expanded", async () => {
    render(<ImportHistoryRow entry={base} lang="EN" onDeleted={noop} onPatched={noop} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("chat-export.json")).toBeInTheDocument();
    expect(screen.getByText(/3 conversations · 42 messages/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resume memory extraction" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
  });

  it("extractionPaused row (extraction_status failed): shows the paused pill and a real resume action", async () => {
    const entry: ImportHistoryEntry = { ...base, extraction_status: "failed", extraction_error: "MEMORY_LIMIT_REACHED" };
    render(<ImportHistoryRow entry={entry} lang="EN" onDeleted={noop} onPatched={noop} />);
    expect(screen.getByText("Extraction paused")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByRole("button", { name: "Resume memory extraction" })).toBeInTheDocument();
    // real taxonomy copy, not the raw code
    expect(screen.getByText(/monthly memory limit/)).toBeInTheDocument();
    expect(screen.queryByText("MEMORY_LIMIT_REACHED")).not.toBeInTheDocument();
  });

  it("interrupted row (processing, past the 30-minute staleness window): shows Interrupted with the honest re-upload hint, no fake retry button", async () => {
    const staleCreatedAt = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    const entry: ImportHistoryEntry = { ...base, status: "processing", created_at: staleCreatedAt, completed_at: null, extraction_status: "pending" };
    render(<ImportHistoryRow entry={entry} lang="EN" onDeleted={noop} onPatched={noop} />);
    expect(screen.getByText("Interrupted")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByText(/interrupted and never finished/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Retry/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
  });

  it("genuinely fresh processing row (created moments ago): shows Processing, not Interrupted", () => {
    const entry: ImportHistoryEntry = { ...base, status: "processing", created_at: new Date().toISOString(), completed_at: null, extraction_status: "pending" };
    render(<ImportHistoryRow entry={entry} lang="EN" onDeleted={noop} onPatched={noop} />);
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.queryByText("Interrupted")).not.toBeInTheDocument();
  });

  it("failed row: shows the real, taxonomy-mapped STALE_PROCESSING_IMPORT copy, never the raw code", async () => {
    const entry: ImportHistoryEntry = { ...base, status: "failed", error: "STALE_PROCESSING_IMPORT", extraction_status: "pending" };
    render(<ImportHistoryRow entry={entry} lang="EN" onDeleted={noop} onPatched={noop} />);
    expect(screen.getByText("Failed")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByText(/interrupted and never finished/)).toBeInTheDocument();
    expect(screen.queryByText("STALE_PROCESSING_IMPORT")).not.toBeInTheDocument();
  });

  it("an unmapped/unknown error code still shows a designed generic message with the code visible for support, never swallowed", async () => {
    const entry: ImportHistoryEntry = { ...base, error: "SOME_BRAND_NEW_DB_ERROR" };
    render(<ImportHistoryRow entry={entry} lang="EN" onDeleted={noop} onPatched={noop} />);
    await userEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByText(/Something went wrong \(code: SOME_BRAND_NEW_DB_ERROR\)/)).toBeInTheDocument();
  });

  it("delete calls the real DELETE endpoint and reports removal only after it actually succeeds", async () => {
    const onDeleted = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
    render(<ImportHistoryRow entry={base} lang="EN" onDeleted={onDeleted} onPatched={noop} />);

    await userEvent.click(screen.getByRole("button", { name: "View details" }));
    await userEvent.click(screen.getByRole("button", { name: /Delete/ }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));

    expect(fetch).toHaveBeenCalledWith(`/api/imports/${base.id}`, { method: "DELETE" });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it("resume extraction calls the real cursor-based extract endpoint, never a re-import", async () => {
    const onPatched = vi.fn();
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ done: true, created: 2, cursor: 42 }) }));
    vi.stubGlobal("fetch", fetchMock);
    const entry: ImportHistoryEntry = { ...base, extraction_status: "pending" };
    render(<ImportHistoryRow entry={entry} lang="EN" onDeleted={noop} onPatched={onPatched} />);

    await userEvent.click(screen.getByRole("button", { name: "View details" }));
    await userEvent.click(screen.getByRole("button", { name: "Resume memory extraction" }));

    expect(fetchMock).toHaveBeenCalledWith(`/api/imports/${base.id}/extract`, { method: "POST" });
    expect(onPatched).toHaveBeenCalledWith({ extraction_status: "completed", extraction_cursor: 42 });
  });
});
