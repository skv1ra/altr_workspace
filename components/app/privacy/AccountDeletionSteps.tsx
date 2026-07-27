"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Body, Label } from "@/components/ui/Text";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import type { useAccountDeletion } from "./useAccountDeletion";

const errorCopyKey = {
  staleSession: "deletionStaleSession",
  emailMismatch: "deletionEmailMismatch",
  rateLimited: "deletionRateLimited",
  generic: "deletionFailedGeneric",
} as const;

/**
 * Pure step content shared by `AccountDeletionDialog` (in-app Privacy
 * Center) and `AccountDeletionPanel` (public `/delete-data`,
 * `/data-deletion/request`) — only the surrounding chrome (`Dialog` vs. a
 * plain panel) differs between the two callers.
 */
export function AccountDeletionSteps({
  deletion,
  lang,
  onCancel,
}: {
  deletion: ReturnType<typeof useAccountDeletion>;
  lang: Lang;
  onCancel: () => void;
}) {
  const t = getSharedCopy(lang).privacy;
  const common = getSharedCopy(lang).common;
  const { state, goToConfirm, setEmail, setPhrase, setReason, canSubmit, submit } = deletion;

  if (state.step === "success") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--edge-hairline)] text-text-primary">
          <Check aria-hidden="true" className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-h4 font-normal text-text-primary">{t.deletionSuccessTitle}</h3>
        {state.reference && (
          <p className="mt-2 text-body text-text-muted">
            {t.deletionSuccessReference}: <strong className="text-text-primary">{state.reference}</strong>
          </p>
        )}
        <p className="mt-2 text-label text-text-muted">{t.deletionSuccessSigningOut}</p>
      </div>
    );
  }

  if (state.step === "confirm") {
    return (
      <div>
        <TextField
          label={t.deletionEmailLabel}
          type="email"
          autoComplete="off"
          value={state.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div className="mt-4">
          <TextField
            label={t.deletionPhraseLabel}
            autoComplete="off"
            spellCheck={false}
            value={state.phrase}
            onChange={(event) => setPhrase(event.target.value)}
          />
        </div>
        <div className="mt-4">
          <TextField
            label={t.deletionReasonLabel}
            value={state.reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        {state.errorKey && (
          <p role="alert" className="mt-4 text-body text-alarm-red">
            {t[errorCopyKey[state.errorKey]]}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn btn-secondary control-focus">
            {t.deletionCancel}
          </button>
          <Button variant="danger" onClick={() => void submit()} disabled={!canSubmit} loading={state.submitting}>
            {state.submitting ? t.deletionSubmitting : t.deletionConfirm}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label>{t.deletionConsequencesIntro}</Label>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        {t.deletionConsequencesDeleted.map((line) => (
          <li key={line} className="text-body text-text-primary">
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-label uppercase text-text-muted">{t.deletionConsequencesRetainedTitle}</p>
      <Body muted className="mt-2">
        {t.deletionConsequencesRetained}
      </Body>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn btn-secondary control-focus">
          {common.cancel}
        </button>
        <Button variant="danger" onClick={goToConfirm}>
          {t.deletionContinue}
        </Button>
      </div>
    </div>
  );
}
