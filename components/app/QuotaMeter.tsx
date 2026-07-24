import Link from "next/link";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./QuotaMeter.module.css";

export interface QuotaMeterProps {
  /** Optional: omit when the caller already renders its own heading right
   *  above this meter (e.g. the dashboard's own editorial rows, 029) —
   *  avoids a redundant duplicate label. */
  label?: string;
  /** Accessible name for the progressbar when `label` is omitted. */
  ariaLabel?: string;
  used: number;
  limit: number;
  lang: Lang;
  /** Query failed server-side — show a quiet unknown state, never a
   *  misleading zero (this prompt's own "quota endpoint failing" edge case). */
  unknown?: boolean;
}

/**
 * Hairline linear meter, three states (normal / near-limit ≥80% / reached
 * 100%), informational only — never disables or blocks anything else on
 * the page by itself, per this prompt's own instruction. No new color: the
 * "reached" state reuses the same red already established for error/alert
 * copy throughout this app (`AuthForm`, `ResetPasswordForm`, ...), not a
 * new accent — `DESIGN_DIRECTION.md`'s own palette table has no accent
 * color at all.
 */
export function QuotaMeter({ label, ariaLabel, used, limit, lang, unknown = false }: QuotaMeterProps) {
  const t = getSharedCopy(lang).quota;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const nearLimit = pct >= 80 && pct < 100;
  const reached = pct >= 100;

  return (
    <div className={styles.wrap}>
      <div className={styles.headRow}>
        {label && <span className={styles.label}>{label}</span>}
        <span className={styles.numbers}>{unknown ? "—" : `${used} / ${limit}`}</span>
      </div>
      {!unknown && (
        <div
          className={styles.track}
          role="progressbar"
          aria-label={ariaLabel ?? label}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={reached ? `${styles.fill} ${styles.fillReached}` : styles.fill}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {unknown && <p className={styles.note}>{t.unknownNote}</p>}
      {!unknown && nearLimit && <p className={styles.note}>{t.nearLimitNote}</p>}
      {!unknown && reached && (
        <p className={`${styles.note} ${styles.noteReached}`}>
          {t.reachedNote}{" "}
          <Link href="/pricing" className={styles.upgradeLink}>
            {t.upgradeLink}
          </Link>
        </p>
      )}
    </div>
  );
}
