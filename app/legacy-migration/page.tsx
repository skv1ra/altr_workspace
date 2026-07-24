"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { updateCurrentProfile } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./page.module.css";

const DONE_KEY = "altr_legacy_migration_completed_v1";
const LEGACY_PATTERN = /^(altr|altr_|altr-)/i;
type LegacyEntry = { key: string; value: unknown; raw: string };

function collectLegacyEntries(): LegacyEntry[] {
  const entries: LegacyEntry[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || key === DONE_KEY || !LEGACY_PATTERN.test(key)) continue;
    const raw = localStorage.getItem(key) ?? "";
    try {
      entries.push({ key, value: JSON.parse(raw), raw });
    } catch {
      entries.push({ key, value: raw, raw });
    }
  }
  return entries;
}

/**
 * Ported verbatim from LEGACY's `app/legacy-migration/page.tsx` (pinned
 * `a22927d`) — the scan pattern, the "safe profile" field allowlist, the
 * export/migrate/delete/continue actions, and the `finish()` contract
 * (`POST /api/auth/legacy-migration/complete`, must-not-change, then clear
 * the `altr_legacy_review` cookie client-side via the `DONE_KEY` marker and
 * redirect) are all byte-identical logic — only the JSX/styling below is
 * new. This page sits outside `app/(app)/` and is deliberately NOT wrapped
 * in `AppShell`: it's a one-time gate `lib/supabase/middleware.ts`
 * (unmodified) redirects a signed-in user to *before* they reach any other
 * protected page while `altr_legacy_review=pending`, the same role it
 * played in LEGACY — not a dashboard destination of its own, so no nav
 * entry was added for it.
 */
export default function LegacyMigrationPage() {
  const router = useRouter();
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).legacyMigration;
  const [entries, setEntries] = useState<LegacyEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEntries(collectLegacyEntries());
  }, []);

  const safeProfile = useMemo(() => {
    const objects = entries
      .map((entry) => entry.value)
      .filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value)));
    const source = objects.find((value) => value.name || value.altrName || value.tone || value.preferences) ?? {};
    return {
      name: typeof source.name === "string" ? source.name.slice(0, 80) : undefined,
      altrName: typeof source.altrName === "string" ? source.altrName.slice(0, 80) : undefined,
      bio: typeof source.bio === "string" ? source.bio.slice(0, 1000) : undefined,
      tone: ["balanced", "warm", "direct", "formal"].includes(String(source.tone)) ? source.tone : undefined,
      preferences: source.preferences && typeof source.preferences === "object" ? source.preferences : undefined,
    };
  }, [entries]);

  async function finish() {
    const response = await fetch("/api/auth/legacy-migration/complete", { method: "POST" });
    if (!response.ok) throw new Error("MIGRATION_COMPLETION_FAILED");
    localStorage.setItem(DONE_KEY, "true");
    router.replace("/dashboard");
    router.refresh();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `altr-legacy-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function migrateSafeData() {
    setBusy(true);
    setMessage("");
    try {
      await updateCurrentProfile(Object.fromEntries(Object.entries(safeProfile).filter(([, value]) => value !== undefined)));
      entries.forEach((entry) => localStorage.removeItem(entry.key));
      await finish();
    } catch {
      setMessage(t.migrateError);
    } finally {
      setBusy(false);
    }
  }

  async function deleteLocalData() {
    setBusy(true);
    try {
      entries.forEach((entry) => localStorage.removeItem(entry.key));
      await finish();
    } catch {
      setMessage(t.deleteError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface variant="inverse" className={styles.page}>
      <Surface variant="page" as="section" className={styles.card}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.title}</h1>

        {entries.length > 0 ? (
          <>
            <p className="mt-4 text-body text-text-muted">
              {entries.length} {t.foundLabel}
            </p>
            <p className="mt-2 text-body text-text-muted">{t.bodyNote}</p>
            <div className={styles.list}>
              {entries.map((entry) => (
                <div key={entry.key} className={styles.listItem}>
                  {entry.key}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-6 text-body text-text-muted">{t.noneFound}</p>
        )}

        {message && (
          <p role="alert" className={styles.alert}>
            {message}
          </p>
        )}

        <div className={styles.actions}>
          {entries.length > 0 ? (
            <>
              <Button variant="secondary" onClick={exportJson}>
                {t.exportJson}
              </Button>
              <Button loading={busy} onClick={() => void migrateSafeData()}>
                {t.migrateSafeProfile}
              </Button>
              <Button variant="danger" loading={busy} onClick={() => void deleteLocalData()}>
                {t.deleteLocally}
              </Button>
            </>
          ) : (
            <Button
              loading={busy}
              onClick={() => {
                setBusy(true);
                finish()
                  .catch(() => setMessage(t.continueError))
                  .finally(() => setBusy(false));
              }}
            >
              {t.continueLabel}
            </Button>
          )}
        </div>
      </Surface>
    </Surface>
  );
}
