"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import { formatProvenance } from "./draftProvenance";
import styles from "./TwinDraftHistory.module.css";

const PAGE_SIZE = 10;
const EXCERPT_LENGTH = 140;

interface DraftRun {
  id: string;
  input_text: string;
  output_text: string | null;
  model: string | null;
  status: string;
  used_memory_ids: string[];
  used_message_ids: string[];
  created_at: string;
}

function excerpt(text: string | null) {
  if (!text) return "";
  return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;
}

export interface TwinDraftHistoryProps {
  lang: Lang;
  /** Bumped by the parent workspace after every successful generate, so a
   *  freshly created run appears here without a manual page reload —
   *  same "start from server, adjust locally" precedent this workspace
   *  already uses elsewhere, just via a refetch instead of local state
   *  surgery, since history is page-based server data, not a flat list. */
  refreshToken: number;
}

/**
 * Real, additive list over `GET /api/ai/drafts` (new this prompt — see
 * `app/api/ai/drafts/route.ts`'s own comment for why it didn't exist
 * before). Archival list, not a chat log: plain hairline-divided rows,
 * selecting one shows the full run read-only rather than expanding
 * inline, per this prompt's own visual requirement and instruction #4.
 */
export function TwinDraftHistory({ lang, refreshToken }: TwinDraftHistoryProps) {
  const t = getSharedCopy(lang).twin;

  const [runs, setRuns] = useState<DraftRun[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const response = await fetch(`/api/ai/drafts?page=${page}&pageSize=${PAGE_SIZE}`);
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (cancelled) return;
        setRuns(body.runs ?? []);
        setTotalPages(Math.max(1, body.totalPages ?? 1));
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, refreshToken]);

  const selected = runs?.find((run) => run.id === selectedId) ?? null;

  return (
    <section className={styles.wrap} aria-labelledby="twin-history-heading">
      <h2 id="twin-history-heading" className={styles.heading}>
        {t.historyHeading}
      </h2>
      <p className={styles.intro}>{t.historyIntro}</p>

      {loadError && (
        <p className={styles.empty} role="alert">
          {t.historyLoadFailed}
        </p>
      )}

      {!loadError && !loading && runs !== null && runs.length === 0 && <p className={styles.empty}>{t.historyEmpty}</p>}

      {!loadError && selected && (
        <div className={styles.detail}>
          <Button variant="ghost" onClick={() => setSelectedId(null)}>
            {t.historyBackAction}
          </Button>
          <h3 className="mt-4 text-h4 font-normal text-text-primary">{t.historyDetailHeading}</h3>
          <p className={styles.rowMeta}>
            {t.historyModelLabel}: {selected.model ?? "—"} · {t.historyDateLabel}: {new Date(selected.created_at).toLocaleString(lang === "UA" ? "uk-UA" : "en-US")}
          </p>
          <p className="mt-2 text-label normal-case text-text-muted">
            {formatProvenance(selected.used_memory_ids.length, selected.used_message_ids.length, lang)}
          </p>

          <div className={styles.detailBlock}>
            <p className={styles.detailLabel}>{t.historyIncomingLabel}</p>
            <p className={styles.detailText}>{selected.input_text}</p>
          </div>
          <div className={styles.detailBlock}>
            <p className={styles.detailLabel}>{t.historyDraftLabel}</p>
            <p className={styles.detailText}>{selected.output_text ?? "—"}</p>
          </div>
        </div>
      )}

      {!loadError && !selected && runs !== null && runs.length > 0 && (
        <>
          <ul className={styles.list}>
            {runs.map((run) => (
              <li key={run.id}>
                <button type="button" className={styles.row} onClick={() => setSelectedId(run.id)}>
                  <span className={styles.rowMeta}>
                    {new Date(run.created_at).toLocaleDateString(lang === "UA" ? "uk-UA" : "en-US")} · {run.model ?? "—"}
                  </span>
                  <span className={styles.rowExcerpt}>{excerpt(run.input_text)}</span>
                  <span className={styles.rowDraftExcerpt}>{excerpt(run.output_text)}</span>
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className={styles.pager}>
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                {getSharedCopy(lang).memory.pagerPrevious}
              </Button>
              <span className={styles.pagerLabel}>
                {page} {getSharedCopy(lang).memory.pagerOfLabel} {totalPages}
              </span>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                {getSharedCopy(lang).memory.pagerNext}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
