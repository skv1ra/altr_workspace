"use client";

import Link from "next/link";
import { PlanBadge } from "@/components/app/PlanBadge";
import { QuotaMeter } from "@/components/app/QuotaMeter";
import type { PlanId } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./DashboardHome.module.css";

type ImportStatus = "processing" | "completed" | "failed" | "deleted";

export interface DashboardHomeProps {
  name: string;
  plan: PlanId;
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
 * numerals, per this prompt's own (031) visual requirement. Originally
 * none of the three linked anywhere (ADR-013 — no dead links, since none
 * of Memory/Imports/Twin had a real page yet). Imports/Twin still don't
 * (032 deliberately kept `/import-conversations` standalone, outside
 * `AppShell`/this dashboard's own nav — see that page's own comment;
 * Twin is still 039, not yet built) — but Memory (036) now has a real
 * page (`/memory`), and that prompt's own `components/app/DashboardHome.tsx`
 * comment explicitly named itself as the place to close this one gap, the
 * same way `AppNav.tsx`'s own comment did. Only the Memory row's
 * label/numeral is wrapped in a real `<Link>` — the `QuotaMeter` beside it
 * stays a plain sibling, not nested inside the link, since its own
 * "reached" state can render a `<Link href="/pricing">` internally and
 * nested `<a>` tags are invalid HTML.
 */
export function DashboardHome({
  name,
  plan,
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
  const nav = getSharedCopy(lang).nav;

  const isNewAccount =
    memoryCount === 0 && draftsUsed === 0 && !lastImport && !lastImportError && !draftsError;

  return (
    <div className={styles.wrap}>
      <div className={styles.greetingRow}>
        <h1 className="text-h1 font-normal text-text-primary">
          {t.greetingPrefix} {firstName(name)}.
        </h1>
        <PlanBadge plan={plan} lang={lang} />
      </div>

      {isNewAccount ? (
        <div className={styles.empty}>
          <h2 className="text-h3 font-normal text-text-primary">{t.emptyAccountTitle}</h2>
          <p className="mt-3 max-w-[52ch] text-body text-text-muted">{t.emptyAccountBody}</p>
        </div>
      ) : (
        <div className={styles.rows}>
          <div className={styles.row}>
            <Link href="/memory" className={styles.label}>
              {nav.memory}
            </Link>
            <Link href="/memory" className={styles.numeral}>
              {memoryCount}
            </Link>
            <QuotaMeter used={memoryCount} limit={memoryLimit} lang={lang} ariaLabel={nav.memory} />
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
            {!draftsError && <p className={styles.numeral}>{draftsUsed}</p>}
            <QuotaMeter used={draftsUsed} limit={draftsLimit} lang={lang} unknown={draftsError} ariaLabel={t.twinLabel} />
            {!draftsError && <p className={styles.meta}>{t.thisMonth}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
