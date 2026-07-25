"use client";

import { useState } from "react";
import { getCurrentProfile, type AltrProfile } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";

type ConsentKind = "conversationProcessing" | "aiMemory";

function formatDate(value: string, lang: Lang) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(lang === "UA" ? "uk-UA" : "en-US", { dateStyle: "long" });
}

/** `POST /api/consents/{grant,withdraw}` (must-not-change) — real,
 *  server-backed consent state from `profile.consents.*AcceptedAt`
 *  (`GET /api/me`, also must-not-change). Neither endpoint returns the
 *  updated profile, so a successful mutation re-fetches `/api/me` itself
 *  (mirroring LEGACY's own `PrivacySettingsPanel.refresh()`) rather than
 *  guessing the new state locally. */
export function ConsentsSection({ profile, onProfileChange, lang }: { profile: AltrProfile; onProfileChange: (profile: AltrProfile) => void; lang: Lang }) {
  const t = getSharedCopy(lang).privacy;
  const [busyKind, setBusyKind] = useState<ConsentKind | null>(null);
  const [errorKind, setErrorKind] = useState<ConsentKind | null>(null);

  const conversationActive = Boolean(profile.consents.conversationProcessingAcceptedAt);
  const memoryActive = Boolean(profile.consents.aiMemoryAcceptedAt);

  async function toggle(kind: ConsentKind, active: boolean) {
    if (busyKind) return;
    setBusyKind(kind);
    setErrorKind(null);
    try {
      const response = await fetch(active ? "/api/consents/withdraw" : "/api/consents/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "conversationProcessing" ? { conversationProcessing: true, locale: lang.toLowerCase() } : { aiMemory: true, locale: lang.toLowerCase() },
        ),
      });
      if (!response.ok) throw new Error();
      const next = await getCurrentProfile();
      if (next) onProfileChange(next);
    } catch {
      setErrorKind(kind);
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <section aria-labelledby="privacy-consents-heading">
      <h2 id="privacy-consents-heading" className="text-h3 font-normal text-text-primary">
        {t.consentsHeading}
      </h2>
      <p className="mt-1 text-label uppercase text-text-muted">
        {t.policyVersionLabel}: {profile.consents.policyVersion || "—"}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ConsentCard
          title={t.consentConversationTitle}
          description={t.consentConversationBody}
          effect={t.consentConversationEffect}
          active={conversationActive}
          recordedAt={profile.consents.conversationProcessingAcceptedAt}
          busy={busyKind === "conversationProcessing"}
          error={errorKind === "conversationProcessing" ? t.consentUpdateFailed : null}
          onToggle={() => void toggle("conversationProcessing", conversationActive)}
          t={t}
          lang={lang}
        />
        <ConsentCard
          title={t.consentMemoryTitle}
          description={t.consentMemoryBody}
          effect={t.consentMemoryEffect}
          active={memoryActive}
          recordedAt={profile.consents.aiMemoryAcceptedAt}
          busy={busyKind === "aiMemory"}
          error={errorKind === "aiMemory" ? t.consentUpdateFailed : null}
          onToggle={() => void toggle("aiMemory", memoryActive)}
          t={t}
          lang={lang}
        />
      </div>
    </section>
  );
}

function ConsentCard({
  title,
  description,
  effect,
  active,
  recordedAt,
  busy,
  error,
  onToggle,
  t,
  lang,
}: {
  title: string;
  description: string;
  effect: string;
  active: boolean;
  recordedAt: string;
  busy: boolean;
  error: string | null;
  onToggle: () => void;
  t: ReturnType<typeof getSharedCopy>["privacy"];
  lang: Lang;
}) {
  return (
    <div className="rounded-2xl border border-[var(--edge-hairline)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-body font-medium text-text-primary">{title}</p>
        <span className="rounded-full border border-[var(--edge-hairline)] px-2.5 py-1 text-label uppercase text-text-muted" data-active={active}>
          {active ? t.granted : t.notGranted}
        </span>
      </div>
      <p className="mt-2 text-body text-text-muted">{description}</p>
      <p className="mt-2 text-label normal-case text-text-muted">{effect}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--edge-hairline)] pt-4">
        <span className="text-label text-text-muted">
          {t.recordedAt}: {formatDate(recordedAt, lang)}
        </span>
        <button type="button" disabled={busy} onClick={onToggle} className={`btn control-focus ${active ? "btn-secondary" : "btn-primary"}`}>
          {active ? t.withdraw : t.grant}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-label text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
