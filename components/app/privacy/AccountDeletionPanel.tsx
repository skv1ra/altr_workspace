"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Body, Heading, Label } from "@/components/ui/Text";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import { AccountDeletionSteps } from "./AccountDeletionSteps";
import { useAccountDeletion } from "./useAccountDeletion";

/** Inline (non-dialog) rendering of the same real ceremony, for the two
 *  public pages that host it directly in a panel rather than a modal —
 *  matching LEGACY's own `/delete-data` and `/data-deletion/request`
 *  layouts, just with the real `/api/privacy/account` contract instead of
 *  either page's own prior local-storage-only or duplicated logic. */
export function AccountDeletionPanel({ lang, email, onDeleted }: { lang: Lang; email: string; onDeleted?: () => void }) {
  const t = getSharedCopy(lang).privacy;
  const [started, setStarted] = useState(false);
  const deletion = useAccountDeletion(onDeleted, email);

  if (!started) {
    return (
      <div>
        <Heading level={3}>{t.immediateDeletionHeading}</Heading>
        <Body muted className="mt-2">
          {t.immediateDeletionBody}
        </Body>
        <Button variant="danger" className="mt-4" onClick={() => setStarted(true)}>
          {t.dangerCta}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Label>{t.dangerHeading}</Label>
      <div className="mt-3">
        <AccountDeletionSteps
          deletion={deletion}
          lang={lang}
          onCancel={() => {
            deletion.reset();
            setStarted(false);
          }}
        />
      </div>
    </div>
  );
}
