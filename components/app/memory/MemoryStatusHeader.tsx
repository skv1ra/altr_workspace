"use client";

import { useState } from "react";
import { updateCurrentProfile, type AltrProfile } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./MemoryStatusHeader.module.css";

export interface MemoryStatusHeaderProps {
  lang: Lang;
  activeMemoryCount: number;
  memoryLimit: number;
  learningEnabled: boolean;
  connections: AltrProfile["connections"];
  preferences: AltrProfile["preferences"];
}

const CONNECTION_KEYS: Array<keyof AltrProfile["connections"]> = ["messages", "email", "calendar", "workspace"];

/**
 * Two cards — "In use" quota and the learning toggle — matching the Altr
 * App v3 Memory screen's own 2-column grid exactly (verified against the
 * live design bundle's rendered DOM, not guessed). The connections list is
 * real, tested functionality this design screen doesn't show at all — kept
 * as a third card below rather than dropped, so real information isn't
 * lost, but it doesn't try to fake a spot in the 2-column layout the
 * design never gave it. Backing fields: `preferences.learning` is real
 * (`altr_user_preferences.memory_learning_enabled`, same field
 * `SettingsView.tsx` already writes via `updateCurrentProfile`) and
 * `profile.connections` is real (`{email, calendar, messages, workspace}`,
 * each backed by `altr_data_connections`) — shown read-only since no
 * connect/disconnect flow exists anywhere in this workspace (ADR-013).
 */
export function MemoryStatusHeader({ lang, activeMemoryCount, memoryLimit, learningEnabled, connections, preferences }: MemoryStatusHeaderProps) {
  const t = getSharedCopy(lang).memory;
  const [learning, setLearning] = useState(learningEnabled);
  const [toggling, setToggling] = useState(false);

  async function toggleLearning() {
    if (toggling) return;
    setToggling(true);
    try {
      const updated = await updateCurrentProfile({ preferences: { ...preferences, learning: !learning } });
      setLearning(updated.preferences.learning);
    } catch {
      // Leave state unchanged on failure — no misleading optimistic flip.
    } finally {
      setToggling(false);
    }
  }

  const pct = memoryLimit > 0 ? Math.max(2, Math.min(100, (activeMemoryCount / memoryLimit) * 100)) : 2;

  return (
    <>
      <div className={styles.grid}>
        <div className={`v3-panel ${styles.quotaCard}`}>
          <p className={styles.label}>{t.activeMemoriesLabel}</p>
          <p className={styles.numeralRow}>
            <span className="v3-stat-numeral">{activeMemoryCount}</span>
            <span className={styles.of}>{lang === "UA" ? "з" : "of"} {memoryLimit} {t.activeMemoriesLabel.toLowerCase()}</span>
          </p>
          <div className={`v3-bar-track ${styles.barTrack}`}>
            <div className="v3-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={`v3-panel ${styles.learningCard}`}>
          <div>
            <p className={styles.learningTitle}>{learning ? t.learningActiveLabel : t.learningPausedLabel}</p>
            <p className={styles.learningHint}>{learning ? t.learningActiveHint : t.learningPausedHint}</p>
          </div>
          <button
            type="button"
            className="v3-switch"
            data-on={learning}
            role="switch"
            aria-checked={learning}
            aria-label={learning ? t.pauseLearning : t.resumeLearning}
            disabled={toggling}
            onClick={() => void toggleLearning()}
          >
            <span className="v3-switch-knob" />
          </button>
        </div>
      </div>

      <div className={`v3-panel ${styles.connectionsBlock}`}>
        <p className={styles.connectionsHeading}>{t.connectedSourcesLabel}</p>
        <ul className={styles.connectionsList}>
          {CONNECTION_KEYS.map((key) => {
            const label = { messages: t.connectionMessages, email: t.connectionEmail, calendar: t.connectionCalendar, workspace: t.connectionWorkspace }[key];
            const isConnected = connections[key];
            return (
              <li key={key} className={styles.connectionRow}>
                <span>{label}</span>
                <span className={isConnected ? styles.connectedBadge : styles.notConnectedBadge}>
                  {isConnected ? t.connectedState : t.notConnectedState}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
