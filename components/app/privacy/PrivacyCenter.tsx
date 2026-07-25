"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
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
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.title}</h1>
        <p className="mt-3 text-body text-text-muted">{t.subtitle}</p>
      </div>

      <ConsentsSection profile={profile} onProfileChange={setProfile} lang={lang} />
      <ExportSection lang={lang} />

      <section aria-labelledby="privacy-danger-heading" className="rounded-2xl border border-[var(--edge-hairline)] p-6 sm:p-8">
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
