"use client";

import { Download, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Surface } from "@/components/ui/Surface";
import { Body, Display, Label } from "@/components/ui/Text";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { formatAmount, formatDate } from "./InvoiceHistoryTable";
import styles from "./ReceiptDetail.module.css";

/** Full shape of one row in `GET /api/billing/me`'s `invoices` array
 *  (must-not-change route, read only) — a superset of `InvoiceHistoryTable
 *  .tsx`'s own `BillingInvoice` (which omits `orderId`, unneeded there):
 *  this page's whole job is finding the one row whose `orderId` matches
 *  the URL param, so it needs the field the table doesn't. */
interface FullBillingInvoice {
  id: string;
  invoiceId: string | null;
  orderId: string | null;
  status: string;
  amount: number;
  currency: string;
  receiptUrl: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface ReceiptDetailProps {
  orderId: string;
}

/**
 * No dedicated backend route for this — `app/api/billing/receipt/
 * [orderId]/route.ts` doesn't exist in this workspace (LEGACY's own
 * receipt page called exactly that route, but it's dead-MVP-era code
 * reading from a `getCurrentProfile()`/local-storage fallback, and
 * `app/api/**` is outside this prompt's own file scope regardless).
 * Reuses the real, already-working `GET /api/billing/me` (must-not-
 * change, the same endpoint `BillingOverview` already fetches, 042) and
 * finds the matching invoice client-side by `orderId` — this prompt's
 * own security requirement ("receipt shows only data the server route
 * already exposes") is satisfied by construction, since nothing here is
 * invented beyond what that one real response already contains. This is
 * also inherently ownership-safe without any extra check: the route
 * scopes `invoices` to the authenticated user's own rows already, so an
 * `orderId` a user doesn't own simply never appears in their own array,
 * regardless of what's typed into the URL.
 */
export function ReceiptDetail({ orderId }: ReceiptDetailProps) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).paymentReturn;

  const [invoices, setInvoices] = useState<FullBillingInvoice[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/billing/me", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (!cancelled) setInvoices(body.invoices ?? []);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const invoice = invoices?.find((item) => item.orderId === orderId) ?? null;

  return (
    <Surface variant="inverse" className="min-h-screen px-5 py-16">
      <div className={styles.wrap}>
        <Link href="/" className="text-body font-medium text-text-primary">
          Altr
        </Link>

        <Surface variant="inverse" className={styles.card}>
          <Label>{t.receiptEyebrow}</Label>
          <Display as="h1" className="mt-4">
            {t.receiptHeading}
          </Display>
          <Body muted className="mt-3">
            {t.receiptIntro}
          </Body>

          {loadError && (
            <p className={styles.notFound} role="alert">
              {t.receiptLoadFailed}
            </p>
          )}

          {!loadError && invoices !== null && !invoice && (
            <div className={styles.notFound}>
              <p className="font-medium text-text-primary">{t.receiptNotFoundHeading}</p>
              <p className="mt-2 text-label normal-case text-text-muted">{t.receiptNotFoundBody}</p>
            </div>
          )}

          {invoice && (
            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>{t.receiptOrderIdLabel}</span>
                <span className={styles.rowValue}>{invoice.orderId}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>{t.receiptDateLabel}</span>
                <span className={styles.rowValue}>{formatDate(invoice.issuedAt ?? invoice.createdAt, lang)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>{t.receiptAmountLabel}</span>
                <span className={styles.rowValue}>{formatAmount(invoice.amount, invoice.currency, lang)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>{t.receiptStatusLabel}</span>
                <span className={styles.rowValue}>{invoice.status}</span>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            {invoice?.receiptUrl && (
              <a href={invoice.receiptUrl} target="_blank" rel="noreferrer" className="btn btn-primary control-focus">
                <Download aria-hidden="true" width={14} height={14} strokeWidth={1.8} />
                {t.viewOriginalReceiptAction}
              </a>
            )}
            <Link href="/billing" className="btn btn-secondary control-focus">
              <ReceiptText aria-hidden="true" width={14} height={14} strokeWidth={1.8} />
              {t.backToBillingAction}
            </Link>
          </div>
        </Surface>
      </div>
    </Surface>
  );
}
