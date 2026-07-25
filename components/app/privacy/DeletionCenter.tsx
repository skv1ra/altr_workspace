"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Surface } from "@/components/ui/Surface";
import { Body, Display, Label } from "@/components/ui/Text";
import { getCurrentProfile, type AltrProfile } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { AccountDeletionPanel } from "./AccountDeletionPanel";
import { DeletionRequestForm } from "./DeletionRequestForm";

/**
 * Shared by `app/delete-data/page.tsx` and `app/data-deletion/request/
 * page.tsx` — LEGACY had two separate, redundant implementations of this
 * exact dual-purpose flow (`/delete-data`'s own local-storage-only
 * prototype, and `/data-deletion/request`'s real, server-backed version);
 * `lib/legal/deletion-content.ts` (must-not-change) itself describes
 * "the external request form on the same page" living alongside the
 * signed-in ceremony at `/delete-data` specifically. One real component
 * satisfies both routes' real requirements instead of duplicating the
 * form twice — noted in the completion report as a deliberate
 * consolidation of LEGACY's own redundancy, not a scope departure.
 */
export function DeletionCenter() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).privacy;
  const [profile, setProfile] = useState<AltrProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getCurrentProfile().then((current) => {
      if (!active) return;
      setProfile(current);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section>
        <Label>{t.requestEyebrow}</Label>
        <Display as="h1" className="mt-4">
          {t.requestTitle}
        </Display>
        <Body muted className="mt-4 max-w-md">
          {t.requestBody}
        </Body>
        <Link href="/data-deletion" className="mt-4 inline-block text-label text-text-muted underline underline-offset-2">
          {t.infoLink}
        </Link>

        {ready && profile && (
          <div className="mt-8 space-y-3">
            <p className="text-label uppercase text-text-muted">{t.exportDownloadsHeading}</p>
            <p className="text-label normal-case text-text-muted">
              {t.signedInAs} <strong className="text-text-primary">{profile.email}</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/api/privacy/export" className="btn btn-secondary control-focus inline-flex items-center gap-2">
                <Download aria-hidden="true" className="h-4 w-4" />
                {t.exportJson}
              </a>
              <a href="/api/privacy/export?format=csv" className="btn btn-secondary control-focus inline-flex items-center gap-2">
                <Download aria-hidden="true" className="h-4 w-4" />
                {t.exportCsv}
              </a>
            </div>
          </div>
        )}
      </section>

      <Surface variant="page" className="rounded-2xl border border-[var(--edge-hairline)] p-6 sm:p-8">
        <DeletionRequestForm lang={lang} defaultEmail={profile?.email ?? ""} />
        {ready && profile && (
          <div className="mt-8 border-t border-[var(--edge-hairline)] pt-8">
            <AccountDeletionPanel lang={lang} email={profile.email} />
          </div>
        )}
      </Surface>
    </div>
  );
}
