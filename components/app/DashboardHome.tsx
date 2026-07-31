"use client";

import Link from "next/link";
import { PlanBadge } from "@/components/app/PlanBadge";
import { QuotaMeter } from "@/components/app/QuotaMeter";
import type { PlanId } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./DashboardHome.module.css";

type ImportStatus = "processing" | "completed" | "failed" | "deleted";

export interface RecentMemory {
  id: string;
  title: string;
  category: string;
  confidence: number;
}

export interface DashboardHomeProps {
  name: string;
  plan: PlanId;
  memoryCount: number;
  memoryLimit: number;
  draftsUsed: number;
  draftsLimit: number;
  draftsError: boolean;
  importsUsed: number;
  importsLimit: number;
  importsError: boolean;
  lastImport: { status: ImportStatus; platform: string; createdAt: string } | null;
  lastImportError: boolean;
  recentMemories: RecentMemory[];
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

/**
 * Altr App v3 redesign: a hero card ("Your Twin is drawing on N memories…")
 * plus three quota tiles and a "Recently learned" list, replacing the
 * previous three hairline-separated rows. Every number here is still a real
 * prop from `app/(app)/dashboard/page.tsx`'s own trusted server queries —
 * this is a visual restructure, not new data. The design's own "Activity"
 * timeline (import/draft events with relative timestamps) is deliberately
 * NOT reproduced: no audit-log table exists to source it from truthfully,
 * and `MemoryRow`'s own precedent (`components/app/memory/MemoryRow.tsx`)
 * already established this codebase's rule against inventing detail an API
 * doesn't actually return.
 */
export function DashboardHome({
  name,
  plan,
  memoryCount,
  memoryLimit,
  draftsUsed,
  draftsLimit,
  draftsError,
  importsUsed,
  importsLimit,
  importsError,
  lastImport,
  lastImportError,
  recentMemories,
}: DashboardHomeProps) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).dashboard;
  const memoryT = getSharedCopy(lang).memory;

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
        <>
          <div className={styles.hero}>
            <p className={styles.heroText}>
              {t.heroPrefix} <strong className={styles.heroNumeral}>{memoryCount} {t.heroMemories}</strong> {t.heroSuffix}
            </p>
            <div className={styles.heroActions}>
              <Link href="/assistants" className={styles.heroPrimary}>
                {t.draftReplyCta}
              </Link>
              <Link href="/memory" className={styles.heroSecondary}>
                {t.reviewMemoryCta}
              </Link>
            </div>
          </div>

          <div className={styles.statGrid}>
            <Link href="/memory" className={styles.statCard} data-testid="stat-memories">
              <span className={styles.statLabel}>{t.statActiveMemories}</span>
              <span className={styles.statNumeral}>
                {memoryCount} <span className={styles.statOf}>{t.of} {memoryLimit}</span>
              </span>
              <QuotaMeter used={memoryCount} limit={memoryLimit} lang={lang} ariaLabel={t.statActiveMemories} />
            </Link>

            <div className={styles.statCard} data-testid="stat-drafts">
              <span className={styles.statLabel}>{t.statAiDrafts}</span>
              {draftsError ? (
                <span className={styles.statUnknown}>—</span>
              ) : (
                <span className={styles.statNumeral}>
                  {draftsUsed} <span className={styles.statOf}>{t.of} {draftsLimit}</span>
                </span>
              )}
              <QuotaMeter used={draftsUsed} limit={draftsLimit} lang={lang} unknown={draftsError} ariaLabel={t.statAiDrafts} />
            </div>

            <div className={styles.statCard} data-testid="stat-imports">
              <span className={styles.statLabel}>{t.statImports}</span>
              {importsError ? (
                <span className={styles.statUnknown}>—</span>
              ) : (
                <span className={styles.statNumeral}>
                  {importsUsed} <span className={styles.statOf}>{t.of} {importsLimit}</span>
                </span>
              )}
              <QuotaMeter used={importsUsed} limit={importsLimit} lang={lang} unknown={importsError} ariaLabel={t.statImports} />
              {lastImport && (
                <p className={styles.statMeta}>
                  {t.importsLastPrefix} {lastImport.platform}
                </p>
              )}
              {!lastImport && !lastImportError && <p className={styles.statMeta}>{t.importsEmpty}</p>}
            </div>
          </div>

          <div className={styles.recent}>
            <div className={styles.recentHead}>
              <h2 className="text-h4 font-normal text-text-primary">{t.recentlyLearnedHeading}</h2>
              <Link href="/memory" className={styles.recentAllLink}>
                {t.allMemoryLink}
              </Link>
            </div>

            {recentMemories.length === 0 ? (
              <p className={styles.recentEmpty}>{t.noMemoriesYetShort}</p>
            ) : (
              <ul className={styles.recentList}>
                {recentMemories.map((memory) => (
                  <li key={memory.id} className={styles.recentRow}>
                    <span className={styles.recentCategory}>{memory.category}</span>
                    <span className={styles.recentTitle}>{memory.title}</span>
                    <span className={styles.recentConfidence}>{memoryT.confidenceLabel} {Math.round(memory.confidence * 100)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
