"use client";

import { Dialog } from "@/components/ui/Dialog";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import { AccountDeletionSteps } from "./AccountDeletionSteps";
import { useAccountDeletion } from "./useAccountDeletion";

export function AccountDeletionDialog({
  open,
  onClose,
  lang,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  onDeleted?: () => void;
}) {
  const t = getSharedCopy(lang).privacy;
  const deletion = useAccountDeletion(onDeleted);

  function handleClose() {
    if (deletion.state.step === "success") return;
    deletion.reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t.deletionStepConsequencesTitle}
      closeOnBackdropClick={false}
      tone="dark"
    >
      <AccountDeletionSteps deletion={deletion} lang={lang} onCancel={handleClose} />
    </Dialog>
  );
}
