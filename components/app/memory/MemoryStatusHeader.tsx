"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { QuotaMeter } from "@/components/app/QuotaMeter";
import { Button } from "@/components/ui/Button";
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
 * Real replacements for LEGACY's two dead `components/memory/` prototype
 * panels (never wired into the live LEGACY page — see `MemoryOverview.tsx`'s
 * own module comment for the full finding), backed by actual fields
 * `getProfileForUser` (`lib/profileServer.ts`, must-not-change) already
 * computes, not fabricated ones:
 * - "Learning Status" was a fake local toggle with no backing field.
 *   `preferences.learning` is real (`altr_user_preferences
 *   .memory_learning_enabled`) — this toggle calls the same
 *   `updateCurrentProfile` helper `SettingsView.tsx` (030) already uses
 *   for the same field via its own save form. Two surfaces writing the
 *   same real field isn't a conflict (an instant quick-toggle here, a
 *   fuller settings form there), so both are kept, deliberately.
 * - "DataSourcesPanel" hardcoded "Telegram / Email / Calendar — Not
 *   connected" for every user, always. `profile.connections` is real
 *   (`{email, calendar, messages, workspace}`, each backed by
 *   `altr_data_connections`) — shown read-only here since no connect/
 *   disconnect flow exists yet anywhere in this workspace (verified: no
 *   OAuth/connection-management route exists) — an honest status list,
 *   not an interactive control that would do nothing (ADR-013).
 */
export function MemoryStatusHeader({ lang, activeMemoryCount, memoryLimit, learningEnabled, connections, preferences }: MemoryStatusHeaderProps) {
  const t = getSharedCopy(lang).memory;
  const [learning, setLearning] = useState(learningEnabled);
  const [toggling, setToggling] = useState(false);

  async function toggleLearning() {
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

  return (
    <div className={styles.wrap}>
      <div className={styles.quotaBlock}>
        <QuotaMeter label={t.activeMemoriesLabel} used={activeMemoryCount} limit={memoryLimit} lang={lang} />
      </div>

      <div className={styles.learningBlock}>
        <div className={styles.learningMain}>
          <span className={learning ? styles.learningDotActive : styles.learningDot} aria-hidden="true" />
          <div>
            <p className="text-body font-medium text-text-primary">{learning ? t.learningActiveLabel : t.learningPausedLabel}</p>
            <p className="mt-1 max-w-sm text-label normal-case text-text-muted">{learning ? t.learningActiveHint : t.learningPausedHint}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => void toggleLearning()} loading={toggling}>
          {learning ? <Pause aria-hidden="true" width={14} height={14} strokeWidth={1.6} /> : <Play aria-hidden="true" width={14} height={14} strokeWidth={1.6} />}
          {learning ? t.pauseLearning : t.resumeLearning}
        </Button>
      </div>

      <div className={styles.connectionsBlock}>
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
    </div>
  );
}
