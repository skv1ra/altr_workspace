"use client";

import { PauseCircle } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import type { Memory } from "./MemoryOverview";
import styles from "./MemoryRow.module.css";

const DESCRIPTION_CLAMP_LENGTH = 240;

function provenanceText(memory: Memory, lang: Lang) {
  const t = getSharedCopy(lang).memory;
  const label = memory.source_type === "manual" ? t.provenanceManual : t.provenanceImport;
  const date = new Date(memory.created_at).toLocaleDateString(lang === "UA" ? "uk-UA" : "en-US", { month: "short", year: "numeric" });
  return `${label} · ${date}`;
}

export interface MemoryRowProps {
  memory: Memory;
  lang: Lang;
  onEdit: () => void;
  onOpenProvenance: () => void;
  onToggleActive: () => void;
  onDeleted: () => void;
  togglingActive: boolean;
}

/**
 * Editorial row — category column + content column, hairline divider,
 * same grid this app's own Prompt 021 `MemoryDemo` already established
 * for visual continuity with the landing page (this prompt's own visual
 * requirement). Confidence renders as a thin hairline bar, not a percent
 * badge (this prompt's own instruction #2, read literally) — the real
 * number is still available to assistive tech via `aria-valuenow` and an
 * `sr-only` label, never dropped, just not displayed as a numeral.
 *
 * Provenance can only ever say "Manual entry" or "From an approved
 * import" — `GET /api/memories` (must-not-change) never returns a
 * platform name for extracted memories, only `source_type`/
 * `source_reference` (`message`/`message:<id>`), so a more specific hint
 * like "from Telegram import" (this prompt's own example phrasing) would
 * be fabricated. See `MemoryOverview.tsx`'s own module comment / this
 * prompt's STATUS entry for the full reasoning.
 */
export function MemoryRow({ memory, lang, onEdit, onOpenProvenance, onToggleActive, onDeleted, togglingActive }: MemoryRowProps) {
  const t = getSharedCopy(lang).memory;
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const needsClamp = memory.description.length > DESCRIPTION_CLAMP_LENGTH;
  const description = expanded || !needsClamp ? memory.description : `${memory.description.slice(0, DESCRIPTION_CLAMP_LENGTH)}…`;
  const confidencePercent = Math.round(memory.confidence * 100);

  async function handleDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error);
      setConfirmingDelete(false);
      toast.push(t.deleteSuccessToast);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <li className={memory.is_active ? styles.row : `${styles.row} ${styles.rowInactive}`}>
      <article className={`v3-panel ${styles.card}`}>
        <div className={styles.headRow}>
          <h3 className={styles.title}>{memory.title}</h3>
          <span className={styles.confidence}>{memory.confidence.toFixed(2)}</span>
        </div>

        {!memory.is_active && (
          <span className={styles.statusPill} data-state="disabled">
            <PauseCircle aria-hidden="true" width={13} height={13} strokeWidth={1.8} />
            {t.disabledState}
          </span>
        )}

        {/* This prompt's own "clear semantics copy" instruction, verified
         * against the real retrieval RPC (`supabase/migrations/
         * 20260715120000_phase_7_real_altr_twin_ai.sql`'s
         * `altr_match_active_memories`, read, not modified: `where
         * m.user_id = ... and m.is_active = true and ...`) rather than
         * assumed — a disabled memory is provably excluded from every
         * Twin draft's retrieval, not just visually greyed out. */}
        {!memory.is_active && <p className={styles.disabledHint}>{t.disabledHint}</p>}

        <p className={styles.description}>
          {description}{" "}
          {needsClamp && (
            <button type="button" className={styles.clampToggle} onClick={() => setExpanded((value) => !value)}>
              {expanded ? t.showLess : t.showMore}
            </button>
          )}
        </p>

        <div className={styles.metaRow}>
          <span className={styles.category}>{memory.category}</span>
          <span className={styles.provenance}>{provenanceText(memory, lang)}</span>
        </div>

        <div className={styles.actions}>
          <button type="button" className="v3-btn-quiet" onClick={onEdit}>
            {t.editAction}
          </button>
          <button type="button" className="v3-btn-quiet" onClick={onToggleActive} disabled={togglingActive}>
            {memory.is_active ? t.disableAction : t.enableAction}
          </button>
          <button type="button" className="v3-btn-quiet" onClick={onOpenProvenance}>
            {t.provenanceAction}
          </button>
          <button type="button" className="v3-btn-quiet" onClick={() => setConfirmingDelete(true)}>
            {t.deleteAction}
          </button>
        </div>
      </article>

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => void handleDelete()}
        title={`${t.deleteConfirmTitlePrefix} "${memory.title}"`}
        description={t.deleteConfirmDescription}
        confirmLabel={t.deleteAction}
        loading={deleting}
        tone="dark"
      />
    </li>
  );
}
