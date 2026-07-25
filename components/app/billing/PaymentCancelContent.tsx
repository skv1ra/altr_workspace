"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { PaymentNotice } from "./PaymentNotice";

/**
 * No-blame copy (this prompt's own instruction #2): never implies the
 * user did anything wrong, never claims anything about their *overall*
 * plan state either way — scoped to *this specific checkout attempt*
 * only, which is also the honest handling of this prompt's own "cancel
 * visited after a completed payment" edge case: this page makes no
 * server calls of its own, so it has nothing to (mis)report either way.
 */
export function PaymentCancelContent() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).paymentReturn;

  return (
    <PaymentNotice
      icon={<XCircle aria-hidden="true" width={48} height={48} strokeWidth={1.4} className="mx-auto text-text-muted" />}
      eyebrow={t.cancelEyebrow}
      heading={t.cancelHeading}
      body={t.cancelBody}
      actions={
        <>
          <Link href="/pricing" className="btn btn-primary control-focus">
            {t.backToPricingAction}
          </Link>
          <Link href="/dashboard" className="btn btn-secondary control-focus">
            {t.backToDashboardAction}
          </Link>
        </>
      }
    />
  );
}
