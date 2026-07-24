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
 * "View in history" per this prompt's own wording links nowhere real: no
 * import-history screen exists yet (034, still `todo` in INDEX.md) — per
 * ADR-013 ("a route ships only when it works end to end"), a dead link
 * would be worse than an honest one. `/dashboard` is the one real surface
 * that already shows this import's status (its own "last import" row,
 * from Prompt 029), so the link points there and is labeled for what it
 * actually does.
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
      <Link href="/dashboard" className={styles.link}>
        {t.duplicateViewLink}
      </Link>
      <div className={styles.hint}>
        <p className={styles.hintHeading}>{t.duplicateDifferentFileHeading}</p>
        <p>{t.duplicateDifferentFileHint}</p>
      </div>
    </div>
  );
}
