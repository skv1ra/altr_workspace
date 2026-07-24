"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileText,
  Hash,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  PauseCircle,
  Send,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import type { ImportPlatform } from "@/lib/imports/types";
import { deriveDisplayStatus, describeImportErrorCode, type DisplayStatus, type ImportHistoryEntry } from "./ImportHistory";
import styles from "./ImportHistoryRow.module.css";

/** Same small monochrome-mark set `ProviderGuide.tsx` already established
 *  (read, not modified — `components/app/imports/ImportHistory*.tsx` is
 *  this prompt's own file scope, `ProviderGuide.tsx` isn't) — duplicated
 *  locally rather than exported from there, the same kind of small,
 *  intentional duplication 031 already documented for `PlanBadge`. */
const PLATFORM_ICONS: Record<ImportPlatform, typeof Send> = {
  telegram: Send,
  gmail: Mail,
  whatsapp: MessageCircle,
  instagram: ImageIcon,
  messenger: MessageSquare,
  slack: Hash,
  discord: Bot,
  manual: FileText,
};

/** Icon + text always paired (this prompt's own "status must survive
 *  grayscale" requirement) — shape alone still tells states apart with
 *  zero color. */
const STATUS_ICONS: Record<DisplayStatus, typeof CheckCircle2> = {
  processing: Loader2,
  extracting: Loader2,
  completed: CheckCircle2,
  extractionPaused: PauseCircle,
  interrupted: AlertTriangle,
  failed: AlertTriangle,
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleString(lang === "UA" ? "uk-UA" : "en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** Independent of `deriveDisplayStatus` on purpose — the top status pill
 *  already folds extraction state into the import's own status once
 *  `status === "completed"`, so this only ever renders for completed
 *  imports (a still-"processing" import's `extraction_status` is just
 *  its pre-set default, not yet meaningful). "pending" reads as paused
 *  here: by the time anyone revisits history, a completed import still
 *  sitting on "pending" means the live session that would have called
 *  extract immediately (033's own `ImportFlow`) never got the chance to. */
function extractionStatusLabel(status: import("./ImportHistory").ExtractionStatus, th: ReturnType<typeof getSharedCopy>["imports"]["history"]) {
  if (status === "completed") return th.status.completed;
  if (status === "processing") return th.status.extracting;
  return th.status.extractionPaused;
}

export interface ImportHistoryRowProps {
  entry: ImportHistoryEntry;
  lang: Lang;
  onDeleted: () => void;
  onPatched: (patch: Partial<ImportHistoryEntry>) => void;
}

/**
 * One editorial row + its expandable provenance detail. Delete is always
 * offered — `app/api/imports/[id]/route.ts`'s `DELETE` (read, not
 * modified) has no status precondition, so it genuinely works for every
 * row regardless of state (this prompt's own "no dead control" rule,
 * verified against the real route rather than assumed). "Resume memory
 * extraction" only appears for `extractionPaused` rows and calls the
 * same cursor-based `POST .../extract` endpoint 033's live retry uses —
 * no file, no re-upload, exactly this prompt's "resume extraction
 * (partial)" instruction.
 *
 * There is deliberately no "retry" action for an `interrupted`/`failed`
 * row beyond delete: the original file was never uploaded to the server
 * (033/032's whole design), so nothing server-side can literally restart
 * a lost import — only the in-memory `File` handle from the live upload
 * session could, and that's gone on a fresh page load. `interruptedHint`
 * says so plainly (delete, then re-upload the same file above) rather
 * than offering a "Retry" button that would either do nothing or lie
 * about what it does.
 */
export function ImportHistoryRow({ entry, lang, onDeleted, onPatched }: ImportHistoryRowProps) {
  const t = getSharedCopy(lang).imports;
  const th = t.history;
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const displayStatus = deriveDisplayStatus(entry);
  const StatusIcon = STATUS_ICONS[displayStatus];
  const PlatformIcon = PLATFORM_ICONS[entry.platform] ?? FileText;
  const detailId = `import-history-detail-${entry.id}`;

  async function handleDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/imports/${entry.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error);
      setConfirmingDelete(false);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  async function handleResume() {
    setResuming(true);
    setResumeError(null);
    try {
      const response = await fetch(`/api/imports/${entry.id}/extract`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        setResumeError(body.error ?? "MEMORY_EXTRACTION_FAILED");
        return;
      }
      onPatched({ extraction_status: body.done ? "completed" : "pending", extraction_cursor: body.cursor ?? entry.extraction_cursor });
    } catch {
      setResumeError("MEMORY_EXTRACTION_FAILED");
    } finally {
      setResuming(false);
    }
  }

  return (
    <li className={styles.row}>
      <div className={styles.summary}>
        <div className={styles.identity}>
          <PlatformIcon aria-hidden="true" width={15} height={15} strokeWidth={1.6} className={styles.platformIcon} />
          <span className={styles.platformLabel}>{t.providers[entry.platform]?.label ?? entry.platform}</span>
          <span dir="auto" className={styles.sourceName}>
            {entry.source_name}
          </span>
        </div>
        <div className={styles.meta}>
          <span>{formatDate(entry.created_at, lang)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {entry.conversations} {th.conversationsLabel} · {entry.messages} {th.messagesLabel}
          </span>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusPill} data-state={displayStatus}>
            <StatusIcon aria-hidden="true" width={14} height={14} strokeWidth={1.8} />
            {th.status[displayStatus]}
          </span>
          <button
            type="button"
            className={styles.detailToggle}
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? th.hideDetails : th.viewDetails}
          </button>
        </div>
      </div>

      {expanded && (
        <div id={detailId} className={styles.detail}>
          <dl className={styles.detailGrid}>
            <div>
              <dt>{th.detailParserVersion}</dt>
              <dd>{entry.parser_version}</dd>
            </div>
            <div>
              <dt>{th.detailFileSize}</dt>
              <dd>{formatBytes(entry.bytes)}</dd>
            </div>
            <div>
              <dt>{th.detailFileType}</dt>
              <dd>
                {entry.file_extension} · {entry.mime_type}
              </dd>
            </div>
            <div>
              <dt>{th.detailStarted}</dt>
              <dd>{formatDate(entry.created_at, lang)}</dd>
            </div>
            {entry.completed_at && (
              <div>
                <dt>{th.detailCompleted}</dt>
                <dd>{formatDate(entry.completed_at, lang)}</dd>
              </div>
            )}
            {entry.status === "completed" && (
              <div>
                <dt>{th.detailExtraction}</dt>
                <dd>{extractionStatusLabel(entry.extraction_status, th)}</dd>
              </div>
            )}
          </dl>

          {entry.error && (
            <p className={styles.errorLine} role="alert">
              {describeImportErrorCode(entry.error, lang)}
            </p>
          )}
          {entry.extraction_error && (
            <p className={styles.errorLine} role="alert">
              {describeImportErrorCode(entry.extraction_error, lang)}
            </p>
          )}
          {displayStatus === "interrupted" && <p className={styles.hintLine}>{th.interruptedHint}</p>}
          {resumeError && (
            <p className={styles.errorLine} role="alert">
              {describeImportErrorCode(resumeError, lang)}
            </p>
          )}

          <div className={styles.actions}>
            {displayStatus === "extractionPaused" && (
              <Button variant="ghost" onClick={() => void handleResume()} loading={resuming}>
                {th.resumeExtractionAction}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              <Trash2 aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
              {th.deleteAction}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => void handleDelete()}
        title={th.deleteConfirmTitle}
        description={th.deleteConfirmDescription}
        confirmLabel={th.deleteAction}
        loading={deleting}
      />
    </li>
  );
}
