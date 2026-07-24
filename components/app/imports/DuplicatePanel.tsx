import Link from "next/link";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./DuplicatePanel.module.css";

export interface DuplicateExisting {
  id: string;
  status: "processing" | "completed";
  createdAt: string;
}

/**
 * Designed resolution panel for the 409 `DUPLICATE_IMPORT` response — never
 * a raw error string. `/api/imports` only ever returns `{ id, status,
 * created_at }` for the existing row, so that's exactly what's shown here;
 * no fabricated detail (source name, message count, ...) is invented.
 *
 * "View in history" per this prompt's own (033) wording originally linked
 * nowhere real: no import-history screen existed yet at the time (034 was
 * still `todo`), so this pointed at `/dashboard` instead — the one real
 * surface that showed this import's status then (its own "last import"
 * row, from Prompt 029). 034 built the real history section right below
 * this panel on the same page; this Prompt 035 fix-level change retargets
 * the link to it (`#import-history`, the id `ImportHistory.tsx` now
 * exposes) rather than leaving it pointed at the now-stale `/dashboard`
 * destination — noted as a follow-up in 034's own STATUS entry, closed
 * here since `DuplicatePanel.tsx` is an "Import component" this prompt's
 * own file scope allows fixing.
 */
export function DuplicatePanel({ existing, lang }: { existing: DuplicateExisting; lang: Lang }) {
  const t = getSharedCopy(lang).imports;
  const statusLabel = getSharedCopy(lang).dashboard.importStatus[existing.status];
  const date = new Date(existing.createdAt).toLocaleString(lang === "UA" ? "uk-UA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className={styles.panel} role="status">
      <p className={styles.heading}>{t.duplicateHeading}</p>
      <dl className={styles.facts}>
        <div>
          <dt>{t.duplicateExistingLabel}</dt>
          <dd>
            {statusLabel} · {date}
          </dd>
        </div>
      </dl>
      <Link href="/import-conversations#import-history" className={styles.link}>
        {t.duplicateViewLink}
      </Link>
      <div className={styles.hint}>
        <p className={styles.hintHeading}>{t.duplicateDifferentFileHeading}</p>
        <p>{t.duplicateDifferentFileHint}</p>
      </div>
    </div>
  );
}
