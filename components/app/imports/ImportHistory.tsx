"use client";

import { useCallback, useEffect, useState } from "react";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import type { Lang } from "@/lib/i18n/lang-store";
import type { ImportPlatform } from "@/lib/imports/types";
import { ImportHistoryRow } from "./ImportHistoryRow";
import styles from "./ImportHistory.module.css";

export type ImportRowStatus = "processing" | "completed" | "failed" | "deleted";
export type ExtractionStatus = "pending" | "processing" | "completed" | "failed";

/** Shape of one row from `GET /api/imports` (`app/api/imports/route.ts`,
 *  read, not modified — its own `select(...)` call is the literal source
 *  of truth for every field named here). Two fields this prompt's own
 *  recipe asked for in the expandable detail — a shortened provenance
 *  hash and human-readable parse warnings — are NOT in that select list
 *  and were never persisted in the first place (`POST /api/imports`'s own
 *  `createSchema` has no `warnings` field, and `source_hash` isn't
 *  selected here even though the column exists) — see
 *  `ImportHistory.tsx`'s own module comment / this prompt's STATUS entry
 *  for the full reasoning; both are real data-model gaps, not omitted by
 *  this prompt's own UI. */
export interface ImportHistoryEntry {
  id: string;
  platform: ImportPlatform;
  source_name: string;
  bytes: number;
  status: ImportRowStatus;
  conversations: number;
  messages: number;
  preview: Array<{ text: string }>;
  parser_version: string;
  mime_type: string;
  file_extension: string;
  raw_file_stored: boolean;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  extraction_status: ExtractionStatus;
  extraction_error: string | null;
  extraction_cursor: number;
}

export type DisplayStatus = "processing" | "interrupted" | "completed" | "extracting" | "extractionPaused" | "failed";

/** Mirrors the server's own stale-processing takeover window
 *  (`app/api/imports/route.ts`, read, not modified: `Date.now() -
 *  new Date(duplicate.created_at).valueOf() > 30 * 60 * 1000`) — this
 *  prompt's own "import stuck in processing past staleness" edge case,
 *  computed client-side since the server only ever reclassifies a stale
 *  row reactively (when a NEW import with the same file hash is
 *  attempted), not on a timer. Without this, a genuinely-abandoned row
 *  would show "Processing" forever. */
const STALE_PROCESSING_MS = 30 * 60 * 1000;

export function deriveDisplayStatus(entry: ImportHistoryEntry, now = Date.now()): DisplayStatus {
  if (entry.status === "processing") {
    return now - new Date(entry.created_at).valueOf() > STALE_PROCESSING_MS ? "interrupted" : "processing";
  }
  if (entry.status === "failed") return "failed";
  if (entry.extraction_status === "processing") return "extracting";
  if (entry.extraction_status === "pending" || entry.extraction_status === "failed") return "extractionPaused";
  return "completed";
}

/**
 * Every code below is real — grepped from `lib/imports/parsers.ts`,
 * `lib/imports/zip.ts`, every `app/api/imports/**` route, and
 * `lib/ai/memory-extraction.ts` (all read in full, none modified —
 * outside this prompt's own file scope). The taxonomy table itself is
 * `imports.errors` in `lib/i18n/copy.ts`, kept as plain data so it stays
 * trivially exhaustively-testable (`tests/unit/import-error-taxonomy.test.ts`)
 * against that same real code list. `extraction_error` in particular can
 * hold arbitrary text that ISN'T one of these codes — a raw Postgres or
 * OpenAI SDK error message, since `lib/ai/memory-extraction.ts`'s own
 * catch block stores `error.message` verbatim for anything not already
 * one of its own thrown codes — so anything missing from the map falls
 * through to a generic message with the raw code/text left visible,
 * never silently swallowed.
 */
export function describeImportErrorCode(code: string, lang: Lang): string {
  const t = getSharedCopy(lang).imports;
  const known = (t.errors as Record<string, string>)[code];
  if (known) return known;
  return `${t.history.errorGenericPrefix} (${t.history.errorGenericCodeLabel}: ${code}).`;
}

/**
 * History list — editorial rows, newest first (the API's own `order by
 * created_at desc` is trusted as-is, no client re-sort). `status ===
 * "deleted"` rows are filtered out client-side: `GET /api/imports`
 * returns them (no status filter in the route), but a "deleted" row
 * reappearing in a page called "History" would contradict what deleting
 * one is supposed to mean to the person who clicked it — same precedent
 * 033's `importsThisMonth` count already set (`item.status !== "deleted"`).
 * Polls every 5s only while something is genuinely in flight (a fresh,
 * non-stale "processing" row, or a "completed" row whose own extraction
 * is "processing"/"pending") — catches an import you just started
 * completing without a manual reload, without polling forever once
 * everything has settled.
 */
export function ImportHistory() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).imports.history;

  const [entries, setEntries] = useState<ImportHistoryEntry[] | null>(null);
  const [atCap, setAtCap] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/imports");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      const rows: ImportHistoryEntry[] = Array.isArray(body.imports) ? body.imports : [];
      setAtCap(rows.length >= 100);
      setEntries(rows.filter((row) => row.status !== "deleted"));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!entries) return undefined;
    const inFlight = entries.some((entry) => {
      if (entry.status === "processing") return Date.now() - new Date(entry.created_at).valueOf() <= STALE_PROCESSING_MS;
      return entry.status === "completed" && (entry.extraction_status === "processing" || entry.extraction_status === "pending");
    });
    if (!inFlight) return undefined;
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [entries, load]);

  const handleDeleted = useCallback((id: string) => {
    setEntries((current) => (current ? current.filter((entry) => entry.id !== id) : current));
  }, []);

  const handlePatched = useCallback((id: string, patch: Partial<ImportHistoryEntry>) => {
    setEntries((current) => (current ? current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) : current));
  }, []);

  return (
    <section className={styles.wrap} aria-label={t.heading}>
      <p className={styles.heading}>{t.heading}</p>

      {entries === null && !loadError && <p className={styles.note}>{t.loading}</p>}
      {loadError && (
        <p className={styles.note} role="alert">
          {t.loadFailed}
        </p>
      )}
      {entries && entries.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyHeading}>{t.emptyHeading}</p>
          <p className={styles.emptyBody}>{t.emptyBody}</p>
        </div>
      )}
      {entries && entries.length > 0 && (
        <>
          <ul className={styles.list}>
            {entries.map((entry) => (
              <ImportHistoryRow
                key={entry.id}
                entry={entry}
                lang={lang}
                onDeleted={() => handleDeleted(entry.id)}
                onPatched={(patch) => handlePatched(entry.id, patch)}
              />
            ))}
          </ul>
          {atCap && <p className={styles.capNote}>{t.capNote}</p>}
        </>
      )}
    </section>
  );
}
