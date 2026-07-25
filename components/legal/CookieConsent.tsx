"use client";

import { Check, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { getCookiePreferences, saveCookiePreferences, type CookiePreferences } from "@/lib/legal/cookie-store";

/**
 * Ported from LEGACY's `components/legal/CookieConsent.tsx` (verbatim
 * consent logic — `getCookiePreferences`/`saveCookiePreferences`, the same
 * `necessary: true` / `functional` / `analytics: false` / `marketing: false`
 * shape, decline-by-default until a real choice is saved) with only its
 * presentation rebuilt around this workspace's own design system
 * (`Dialog` from 010 instead of a hand-rolled focus trap, `Button`, shared
 * `t.cookie` copy). One real finding worth recording: LEGACY itself never
 * mounted this component anywhere (`grep` across LEGACY's own `app/` and
 * `components/` trees found zero imports outside the file's own
 * declaration) — Footer's real "Cookie Preferences" button already
 * dispatches `altr-open-cookie-preferences` and has since 024, but nothing
 * has ever listened for it until this component is mounted at the root
 * layout below. This is the banner's first time actually appearing to a
 * user in either codebase, not a restyle of previously-live behavior.
 */
export function CookieConsent() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).cookie;
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const current = getCookiePreferences();
    if (current) {
      setFunctional(current.functional);
      return;
    }
    const timer = window.setTimeout(() => setShowBanner(true), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const openHandler = () => {
      setFunctional(getCookiePreferences()?.functional ?? false);
      setShowModal(true);
    };
    window.addEventListener("altr-open-cookie-preferences", openHandler);
    return () => window.removeEventListener("altr-open-cookie-preferences", openHandler);
  }, []);

  /**
   * `saveCookiePreferences` (must-not-change) only dispatches
   * `altr-cookie-preferences-change`, never `altr-language-change` — so
   * without this, every *other* mounted `useLang()` instance (Header,
   * Footer, ...) would keep showing the pre-choice language until their
   * next unrelated re-render. Dispatching the real event they already
   * listen for, with the value `functionalStorageAllowed()` will now
   * actually produce (unchanged `lang` if accepted, forced "EN" if
   * rejected — storage was just cleared), keeps every instance honestly
   * in sync the instant a choice is made, without touching `cookie-store.ts`.
   */
  function apply(nextFunctional: boolean, source: CookiePreferences["source"]) {
    saveCookiePreferences(nextFunctional, source, lang);
    setFunctional(nextFunctional);
    setShowBanner(false);
    setShowModal(false);
    const effective = nextFunctional ? lang : "EN";
    window.dispatchEvent(new CustomEvent<typeof lang>("altr-language-change", { detail: effective }));
  }

  return (
    <>
      {showBanner && (
        <section
          aria-label={t.bannerTitle}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--edge-hairline)] surface-inverse px-5 py-6 shadow-elevated sm:px-8"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-label uppercase text-text-muted">{t.bannerTitle}</p>
              <p className="mt-2 max-w-xl text-body text-text-muted">{t.bannerBody}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => apply(true, "banner")}>
                {t.acceptFunctional}
              </Button>
              <Button variant="secondary" onClick={() => apply(false, "banner")}>
                {t.rejectNonEssential}
              </Button>
              <Button variant="ghost" onClick={() => setShowModal(true)}>
                <Settings2 aria-hidden="true" className="h-4 w-4" />
                {t.customize}
              </Button>
              <Link href="/cookies" className="px-2 text-label text-text-muted underline underline-offset-2">
                {t.policy}
              </Link>
            </div>
          </div>
        </section>
      )}

      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t.modalTitle}
        description={t.modalBody}
      >
        <div className="space-y-3">
          <PreferenceRow title={t.necessary} description={t.necessaryDescription} state="on" />
          <PreferenceRow
            title={t.functional}
            description={t.functionalDescription}
            state={functional ? "on" : "off"}
            onToggle={() => setFunctional((value) => !value)}
          />
          <PreferenceRow title={t.analytics} description={t.analyticsDescription} state="unavailable" unavailable={t.unavailable} />
          <PreferenceRow title={t.marketing} description={t.marketingDescription} state="unavailable" unavailable={t.unavailable} />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => apply(functional, "preferences")}>
            {t.save}
          </Button>
          <Button variant="secondary" onClick={() => apply(false, "preferences")}>
            {t.rejectNonEssential}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function PreferenceRow({
  title,
  description,
  state,
  onToggle,
  unavailable,
}: {
  title: string;
  description: string;
  state: "on" | "off" | "unavailable";
  onToggle?: () => void;
  unavailable?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--edge-hairline)] px-4 py-3">
      <div className="pr-4">
        <p className="text-body text-text-primary">{title}</p>
        <p className="mt-1 text-label normal-case text-text-muted">{description}</p>
      </div>
      {state === "unavailable" ? (
        <span className="rounded-full border border-[var(--edge-hairline)] px-2.5 py-1 text-label uppercase text-text-muted">
          {unavailable}
        </span>
      ) : onToggle ? (
        <button
          type="button"
          role="switch"
          aria-checked={state === "on"}
          aria-label={title}
          onClick={onToggle}
          data-checked={state === "on"}
          className="control-focus relative h-7 w-12 flex-none rounded-full border border-[var(--edge-hairline)] bg-[rgb(var(--altr-silver-rgb)/40%)] transition data-[checked=true]:bg-[var(--text-primary)]"
        >
          <span
            aria-hidden="true"
            className="absolute top-0.5 h-6 w-6 rounded-full bg-[var(--surface-page)] shadow-sm transition"
            style={{ left: state === "on" ? "calc(100% - 1.5rem - 2px)" : "2px" }}
          />
        </button>
      ) : (
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[var(--edge-hairline)] text-text-primary">
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}
