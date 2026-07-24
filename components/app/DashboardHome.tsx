"use client";

import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./DashboardHome.module.css";

type ImportStatus = "processing" | "completed" | "failed" | "deleted";

export interface DashboardHomeProps {
  name: string;
  memoryCount: number;
  memoryLimit: number;
  draftsUsed: number;
  draftsLimit: number;
  draftsError: boolean;
  lastImport: { status: ImportStatus; platform: string; createdAt: string } | null;
  lastImportError: boolean;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

/**
 * Three editorial rows, not cards — hairline-separated, big quiet
 * numerals, per this prompt's own visual requirement. None of the three
 * link anywhere yet: Memory (036), Imports (032), and Twin (039) don't
 * have a page in this workspace yet, and this prompt's own instruction #4
 * ("nav entries for screens that do not exist yet are omitted entirely,
 * ADR-013 — no dead links") is applied consistently here too, not just to
 * `AppNav` — these rows are read-only status until their own section
 * exists to link to. Same reasoning drops the Visual requirements' "one
 * focal CTA (Import conversations)" for the empty-account state below:
 * that CTA's only destination, `/import-conversations`, doesn't exist in
 * this workspace either.
 */
export function DashboardHome({
  name,
  memoryCount,
  memoryLimit,
  draftsUsed,
  draftsLimit,
  draftsError,
  lastImport,
  lastImportError,
}: DashboardHomeProps) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).dashboard;

  const isNewAccount =
    memoryCount === 0 && draftsUsed === 0 && !lastImport && !lastImportError && !draftsError;

  return (
    <div className={styles.wrap}>
      <p className="text-h1 font-normal text-text-primary">
        {t.greetingPrefix} {firstName(name)}.
      </p>

      {isNewAccount ? (
        <div className={styles.empty}>
          <p className="text-h3 font-normal text-text-primary">{t.emptyAccountTitle}</p>
          <p className="mt-3 max-w-[52ch] text-body text-text-muted">{t.emptyAccountBody}</p>
        </div>
      ) : (
        <div className={styles.rows}>
          <div className={styles.row}>
            <p className={styles.label}>{getSharedCopy(lang).nav.memory}</p>
            <p className={styles.numeral}>{memoryCount}</p>
            <p className={styles.meta}>
              {t.ofLimit} {memoryLimit} {t.memoryQuotaLabel}
            </p>
          </div>

          <div className={styles.row}>
            <p className={styles.label}>{t.importsLabel}</p>
            {lastImportError ? (
              <p className={styles.unknown}>—</p>
            ) : lastImport ? (
              <>
                <p className={styles.numeral}>{getSharedCopy(lang).dashboard.importStatus[lastImport.status]}</p>
                <p className={styles.meta}>
                  {t.importsLastPrefix} {lastImport.platform}
                </p>
              </>
            ) : (
              <p className={styles.meta}>{t.importsEmpty}</p>
            )}
          </div>

          <div className={styles.row}>
            <p className={styles.label}>{t.twinLabel}</p>
            {draftsError ? (
              <p className={styles.unknown}>—</p>
            ) : (
              <>
                <p className={styles.numeral}>{draftsUsed}</p>
                <p className={styles.meta}>
                  {t.ofLimit} {draftsLimit} {t.twinQuotaLabel} · {t.thisMonth}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
