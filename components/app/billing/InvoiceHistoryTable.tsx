import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./InvoiceHistoryTable.module.css";

/** Shape of one row in `GET /api/billing/me`'s `invoices` array
 *  (must-not-change route, read only) — no `plan_id` of its own, which is
 *  why the description column below is deliberately generic rather than
 *  naming a specific plan tier per row (see copy's own comment). */
export interface BillingInvoice {
  id: string;
  status: string;
  amount: number;
  currency: string;
  receiptUrl: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface InvoiceHistoryTableProps {
  invoices: BillingInvoice[];
  lang: Lang;
}

function formatAmount(cents: number, currency: string, lang: Lang) {
  try {
    return new Intl.NumberFormat(lang === "UA" ? "uk-UA" : "en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function formatDate(value: string, lang: Lang) {
  return new Date(value).toLocaleDateString(lang === "UA" ? "uk-UA" : "en-US", { dateStyle: "medium" });
}

/**
 * A real `<table>`, not a styled list — this prompt's own "typeset like a
 * fine invoice" visual requirement. Status renders as plain typographic
 * weight (failed rows lean muted/italic), never a colored chip.
 * Receipt links point straight at each invoice's own real, provider-
 * hosted `receiptUrl` — the internal `/payment/receipt/[orderId]` route
 * this prompt's own "files to inspect" note assumes exists does not exist
 * in this workspace yet (043's own scope, confirmed via `Glob` before
 * writing this file); linking to the real, already-working external URL
 * the data already carries is the honest choice over a route that would
 * 404 today.
 */
export function InvoiceHistoryTable({ invoices, lang }: InvoiceHistoryTableProps) {
  const t = getSharedCopy(lang).billing;

  if (invoices.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t.tableDateHeader}</th>
            <th scope="col">{t.tableDescriptionHeader}</th>
            <th scope="col">{t.tableAmountHeader}</th>
            <th scope="col">{t.tableStatusHeader}</th>
            <th scope="col">{t.tableReceiptHeader}</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{formatDate(invoice.issuedAt ?? invoice.createdAt, lang)}</td>
              <td>{t.invoiceDescription}</td>
              <td className={styles.amountCell}>{formatAmount(invoice.amount, invoice.currency, lang)}</td>
              <td className={invoice.status === "failed" ? `${styles.statusCell} ${styles.statusFailed}` : styles.statusCell}>
                {t.invoiceStatusLabels[invoice.status as keyof typeof t.invoiceStatusLabels] ?? invoice.status}
              </td>
              <td>
                {invoice.receiptUrl ? (
                  <a href={invoice.receiptUrl} target="_blank" rel="noreferrer" className={styles.receiptLink}>
                    {t.receiptLinkLabel}
                  </a>
                ) : (
                  <span className={styles.receiptUnavailable}>{t.receiptUnavailable}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
