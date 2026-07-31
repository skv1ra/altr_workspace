"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import type { AltrProfile } from "@/lib/auth";
import { AccountDeletionDialog } from "./AccountDeletionDialog";
import { ConsentsSection } from "./ConsentsSection";
import { ExportSection } from "./ExportSection";

/**
 * The unified privacy center (Prompt 045) — consents, export, and
 * account deletion in one authenticated surface, replacing LEGACY's own
 * scattered `PrivacySettingsPanel` (a local-profile-era component this
 * workspace's real Supabase-backed `AltrProfile`/`/api/me` supersede, not
 * ported verbatim). Real URL is `/privacy-center`, not the prompt's own
 * literal `app/(app)/privacy/page.tsx` — `/privacy` is already the real,
 * must-not-move marketing Privacy Policy route (`app/(public)/privacy/
 * page.tsx`, referenced by `app/sitemap.ts` and `Footer.tsx`); the two
 * would collide at build time under the exact same URL. See STATUS.md
 * for the full verification.
 */
export function PrivacyCenter({ profile: initialProfile }: { profile: AltrProfile }) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).privacy;
  const [profile, setProfile] = useState(initialProfile);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-1 py-2">
      <div>
        <p className="v3-eyebrow">{t.eyebrow}</p>
        <h1 className="v3-h1">{t.title}</h1>
        <p className="mt-3 text-body text-text-muted">{t.subtitle}</p>
      </div>

      <ConsentsSection profile={profile} onProfileChange={setProfile} lang={lang} />
      <ExportSection lang={lang} />

      <section aria-labelledby="privacy-legal-heading">
        <h2 id="privacy-legal-heading" className="text-h3 font-normal text-text-primary">
          {t.legalHeading}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/terms" className="btn btn-secondary control-focus">
            {t.legalTerms}
          </Link>
          <Link href="/privacy" className="btn btn-secondary control-focus">
            {t.legalPrivacy}
          </Link>
          <Link href="/cookies" className="btn btn-secondary control-focus">
            {t.legalCookies}
          </Link>
          <Link href="/data-deletion" className="btn btn-secondary control-focus">
            {t.legalDeletion}
          </Link>
          <CookiePreferencesButton className="btn btn-secondary control-focus">
            {t.legalCookiePreferences}
          </CookiePreferencesButton>
        </div>
      </section>

      <section aria-labelledby="privacy-danger-heading" className="v3-panel" style={{ padding: "34px 36px" }}>
        <h2 id="privacy-danger-heading" className="text-h3 font-normal text-text-primary">
          {t.dangerHeading}
        </h2>
        <p className="mt-2 text-body text-text-muted">{t.dangerBody}</p>
        <Button variant="danger" className="mt-4" onClick={() => setDeleteOpen(true)}>
          {t.dangerCta}
        </Button>
      </section>

      <AccountDeletionDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        lang={lang}
        onDeleted={() => {
          window.location.assign("/");
        }}
      />
    </div>
  );
}
