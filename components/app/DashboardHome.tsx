"use client";

import Link from "next/link";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import type { PlanId } from "@/lib/auth";
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

function barWidth(used: number, limit: number) {
  if (limit <= 0) return "2%";
  return `${Math.max(2, Math.min(100, (used / limit) * 100))}%`;
}

/**
 * Pixel-matched to the Altr App v3 Claude Design export — every class here
 * (`.v3-*`, `app/styles/app-v3.css`) reproduces literal values read
 * straight off the design bundle's own rendered DOM (inline styles),
 * not approximated from this app's existing marketing tokens. Content and
 * numbers stay real, from `app/(app)/dashboard/page.tsx`'s server queries.
 * The design's own plan badge next to the greeting and its "Activity"
 * timeline are both NOT reproduced: the live bundle's own markup has no
 * plan badge on this screen at all (checked directly, not assumed), and
 * no audit-log table exists to source real activity events from —
 * `MemoryRow.tsx`'s own module comment already established this
 * codebase's rule against inventing detail an API doesn't actually return.
 */
export function DashboardHome({
  name,
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
    <div>
      <p className="v3-eyebrow">{t.eyebrow}</p>
      <h1 className="v3-h1">
        {t.greetingPrefix} {firstName(name)}.
      </h1>

      {isNewAccount ? (
        <div className={`v3-panel ${styles.empty}`}>
          <p className={styles.heroText}>{t.emptyAccountTitle}</p>
          <p className="v3-intro" style={{ marginTop: 16 }}>
            {t.emptyAccountBody}
          </p>
          <div className={styles.heroActions}>
            <Link href="/import-conversations" className={`v3-btn-solid ${styles.emptyCta}`}>
              {memoryT.emptyNoneCta}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className={`v3-panel ${styles.hero}`}>
            <p className={styles.heroText}>
              {t.heroPrefix} <span className={styles.heroNumeral}>{memoryCount} {t.heroMemories}</span> {t.heroSuffix}
            </p>
            <div className={styles.heroActions}>
              <Link href="/assistants" className="v3-btn-solid">
                {t.draftReplyCta}
              </Link>
              <Link href="/memory" className="v3-btn-quiet">
                {t.reviewMemoryCta}
              </Link>
            </div>
          </div>

          <div className={styles.statGrid}>
            <div className={`v3-panel ${styles.statCard}`} data-testid="stat-memories">
              <p className={styles.statLabel}>{t.statActiveMemories}</p>
              <p className={styles.statNumeralRow}>
                <span className="v3-stat-numeral">{memoryCount}</span>
                <span className={styles.statOf}>{t.of} {memoryLimit}</span>
              </p>
              <div className={`v3-bar-track ${styles.statBarTrack}`}>
                <div className="v3-bar-fill" style={{ width: barWidth(memoryCount, memoryLimit) }} />
              </div>
            </div>

            <div className={`v3-panel ${styles.statCard}`} data-testid="stat-drafts">
              <p className={styles.statLabel}>{t.statAiDrafts}</p>
              {draftsError ? (
                <p className={styles.statUnknown}>—</p>
              ) : (
                <p className={styles.statNumeralRow}>
                  <span className="v3-stat-numeral">{draftsUsed}</span>
                  <span className={styles.statOf}>{t.of} {draftsLimit}</span>
                </p>
              )}
              {!draftsError && (
                <div className={`v3-bar-track ${styles.statBarTrack}`}>
                  <div className="v3-bar-fill" style={{ width: barWidth(draftsUsed, draftsLimit) }} />
                </div>
              )}
            </div>

            <div className={`v3-panel ${styles.statCard}`} data-testid="stat-imports">
              <p className={styles.statLabel}>{t.statImports}</p>
              {importsError ? (
                <p className={styles.statUnknown}>—</p>
              ) : (
                <p className={styles.statNumeralRow}>
                  <span className="v3-stat-numeral">{importsUsed}</span>
                  <span className={styles.statOf}>{t.of} {importsLimit}</span>
                </p>
              )}
              {!importsError && (
                <div className={`v3-bar-track ${styles.statBarTrack}`}>
                  <div className="v3-bar-fill" style={{ width: barWidth(importsUsed, importsLimit) }} />
                </div>
              )}
              {lastImport && <p className={styles.statMeta}>{t.importsLastPrefix} {lastImport.platform}</p>}
              {!lastImport && !lastImportError && <p className={styles.statMeta}>{t.importsEmpty}</p>}
            </div>
          </div>

          <section className={`v3-panel ${styles.recent}`}>
            <div className={styles.recentHead}>
              <h2 className="v3-h2">{t.recentlyLearnedHeading}</h2>
              <Link href="/memory" className="v3-btn-quiet">
                {t.allMemoryLink}
              </Link>
            </div>

            {recentMemories.length === 0 ? (
              <p className={styles.recentEmpty}>{t.noMemoriesYetShort}</p>
            ) : (
              <ul className={styles.recentList}>
                {recentMemories.map((memory) => (
                  <li key={memory.id} className={styles.recentRow}>
                    <p className={styles.recentTitle}>{memory.title}</p>
                    <span className={styles.recentCategory}>{memory.category}</span>
                    <span className={styles.recentConfidence}>{memory.confidence.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
