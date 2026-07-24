"use client";

import { Dialog } from "@/components/ui/Dialog";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import type { Memory } from "./MemoryOverview";
import styles from "./MemoryProvenanceDialog.module.css";

export interface MemoryProvenanceDialogProps {
  memory: Memory | null;
  lang: Lang;
  onClose: () => void;
}

/**
 * "Reads as an archival record" (this prompt's own visual requirement):
 * hairline vertical timeline, monospaced reference IDs. Every field here
 * is exactly what `GET /api/memories` already returns (must-not-change) —
 * `source_type`/`source_reference`/`excerpt`/`import_id`/`conversation_id`/
 * `message_id` per source, `extraction_model`/`extraction_version` on the
 * memory itself — nothing new is fetched.
 *
 * Excerpts render as plain JSX text content (React escapes it — never
 * `dangerouslySetInnerHTML`), per this prompt's own "render as text,
 * never as HTML" requirement: these excerpts are already-sanitized stored
 * text (`lib/ai/memory-extraction.ts`'s own `excerpt: String(...).slice(0,
 * 500)`), but rendering them as text regardless is the safe default
 * either way.
 *
 * Dangling references (an id present but its source row long since
 * deleted — this prompt's own edge case) are handled by construction: an
 * id is only ever rendered if it's actually present on the record, and
 * no id is ever "resolved" to a human name via an extra lookup this
 * component doesn't have — so there's nothing to break when the
 * reference no longer points at anything live.
 */
export function MemoryProvenanceDialog({ memory, lang, onClose }: MemoryProvenanceDialogProps) {
  const t = getSharedCopy(lang).memory;

  return (
    <Dialog open={memory !== null} onClose={onClose} title={t.provenanceDialogTitle} tone="dark">
      {memory && (
        <div>
          <dl className={styles.summary}>
            <div>
              <dt>{t.provenanceExtractionModelLabel}</dt>
              <dd className={styles.mono}>{memory.extraction_model ?? t.provenanceNotApplicable}</dd>
            </div>
            <div>
              <dt>{t.provenanceExtractionVersionLabel}</dt>
              <dd className={styles.mono}>{memory.extraction_version ?? t.provenanceNotApplicable}</dd>
            </div>
          </dl>

          {memory.altr_memory_sources.length === 0 ? (
            <p className="mt-6 text-label normal-case text-text-muted">{t.provenanceNoSources}</p>
          ) : (
            <ol className={styles.timeline}>
              {memory.altr_memory_sources.map((source) => (
                <li key={source.id} className={styles.timelineItem}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <div className={styles.timelineBody}>
                    <p className={styles.sourceType}>{source.source_type}</p>
                    {source.source_reference && <p className={styles.mono}>{source.source_reference}</p>}
                    {source.excerpt && <p className={styles.excerpt}>{source.excerpt}</p>}
                    {(source.import_id || source.conversation_id || source.message_id) && (
                      <dl className={styles.linkGrid}>
                        {source.import_id && (
                          <div>
                            <dt>{t.provenanceImportIdLabel}</dt>
                            <dd className={styles.mono}>{source.import_id}</dd>
                          </div>
                        )}
                        {source.conversation_id && (
                          <div>
                            <dt>{t.provenanceConversationIdLabel}</dt>
                            <dd className={styles.mono}>{source.conversation_id}</dd>
                          </div>
                        )}
                        {source.message_id && (
                          <div>
                            <dt>{t.provenanceMessageIdLabel}</dt>
                            <dd className={styles.mono}>{source.message_id}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          <button type="button" onClick={onClose} className="btn btn-secondary control-focus mt-6">
            {getSharedCopy(lang).common.close}
          </button>
        </div>
      )}
    </Dialog>
  );
}
