import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryProvenanceDialog } from "@/components/app/memory/MemoryProvenanceDialog";
import type { Memory } from "@/components/app/memory/MemoryOverview";

const extracted: Memory = {
  id: "11111111-1111-4111-8111-111111111111",
  category: "communication_style",
  title: "Short, direct replies",
  description: "Keeps replies concise.",
  confidence: 0.8,
  source_type: "message",
  source_reference: "message:1",
  is_active: true,
  created_at: "2026-03-15T10:00:00.000Z",
  updated_at: "2026-03-15T10:00:00.000Z",
  extraction_model: "gpt-real-model",
  extraction_version: "phase-7-v1",
  altr_memory_sources: [
    {
      id: "source-1",
      source_type: "message",
      source_reference: "message:77777777-7777-4777-8777-777777777777",
      excerpt: "<b>not html</b>, just stored text with angle brackets",
      import_id: "22222222-2222-4222-8222-222222222222",
      conversation_id: "33333333-3333-4333-8333-333333333333",
      message_id: "77777777-7777-4777-8777-777777777777",
      assistant_run_id: null,
    },
  ],
};

const manual: Memory = { ...extracted, source_type: "manual", extraction_model: null, extraction_version: "manual-v1", altr_memory_sources: [] };

function noop() {}

describe("MemoryProvenanceDialog", () => {
  it("shows the real extraction model/version for an AI-extracted memory", () => {
    render(<MemoryProvenanceDialog memory={extracted} lang="EN" onClose={noop} />);
    expect(screen.getByText("gpt-real-model")).toBeInTheDocument();
    expect(screen.getByText("phase-7-v1")).toBeInTheDocument();
  });

  it("shows 'not applicable' for a manually-added memory's null extraction model (real API never sets one on manual entries), and the no-sources state", () => {
    render(<MemoryProvenanceDialog memory={manual} lang="EN" onClose={noop} />);
    expect(screen.getByText("Not applicable — added manually")).toBeInTheDocument();
    // `POST /api/memories` (read, not modified) always sets extraction_version
    // to the literal sentinel "manual-v1" for manual entries — real, not null.
    expect(screen.getByText("manual-v1")).toBeInTheDocument();
    expect(screen.getByText("No linked source records.")).toBeInTheDocument();
  });

  it("renders every source field the real API returns — type, reference, excerpt, and linked import/conversation/message ids", () => {
    render(<MemoryProvenanceDialog memory={extracted} lang="EN" onClose={noop} />);
    expect(screen.getByText("message")).toBeInTheDocument();
    expect(screen.getByText("message:77777777-7777-4777-8777-777777777777")).toBeInTheDocument();
    expect(screen.getByText("22222222-2222-4222-8222-222222222222")).toBeInTheDocument();
    expect(screen.getByText("33333333-3333-4333-8333-333333333333")).toBeInTheDocument();
  });

  it("renders the excerpt as plain text, never as HTML (angle brackets show literally, no real <b> element is created)", () => {
    render(<MemoryProvenanceDialog memory={extracted} lang="EN" onClose={noop} />);
    expect(screen.getByText("<b>not html</b>, just stored text with angle brackets")).toBeInTheDocument();
    expect(document.querySelector("b")).not.toBeInTheDocument();
  });

  it("a dangling reference (an id present with no way to resolve it) still renders honestly, without crashing or inventing a name", () => {
    const dangling: Memory = {
      ...extracted,
      altr_memory_sources: [{ ...extracted.altr_memory_sources[0], import_id: "99999999-9999-4999-8999-999999999999", conversation_id: null, message_id: null }],
    };
    render(<MemoryProvenanceDialog memory={dangling} lang="EN" onClose={noop} />);
    expect(screen.getByText("99999999-9999-4999-8999-999999999999")).toBeInTheDocument();
  });
});
