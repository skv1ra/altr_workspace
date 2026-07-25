"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { PaymentNotice } from "./PaymentNotice";

/**
 * `/billing/return`'s real current role, found while reading this
 * prompt's own must-not-change `lib/billing/lemonsqueezy.ts` in full:
 * the only configured Lemon Squeezy redirect target anywhere in this
 * workspace is `createHostedCheckout`'s own `productOptions.redirectUrl`,
 * which points at `/payment/success` — never `/billing/return`. The
 * customer-portal URL (`getFreshCustomerPortalUrl`) is Lemon Squeezy's
 * own hosted `urls.customer_portal` value, also unrelated. This route is
 * dormant in the current backend, not broken — LEGACY shipped it (likely
 * from an earlier integration iteration) and this prompt's own
 * instruction #3 asks to "preserve behavior under new skin" regardless,
 * so its honest, static, no-server-call content is kept working exactly
 * as LEGACY had it, restyled.
 */
export function BillingReturnContent() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).paymentReturn;

  return (
    <PaymentNotice
      icon={<CheckCircle2 aria-hidden="true" width={48} height={48} strokeWidth={1.4} className="mx-auto text-text-primary" />}
      eyebrow={t.returnEyebrow}
      heading={t.returnHeading}
      body={t.returnBody}
      actions={
        <>
          <Link href="/dashboard" className="btn btn-primary control-focus">
            {t.goToDashboardAction}
          </Link>
          <Link href="/pricing" className="btn btn-secondary control-focus">
            {t.viewPricingAction}
          </Link>
        </>
      }
    />
  );
}
