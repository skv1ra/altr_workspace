"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QuotaMeter } from "@/components/app/QuotaMeter";
import { Button } from "@/components/ui/Button";
import { getPlanLimits } from "@/lib/billing/limits";
import type { PlanId } from "@/lib/billing/types";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { InvoiceHistoryTable, type BillingInvoice } from "./InvoiceHistoryTable";
import styles from "./BillingOverview.module.css";

type SubscriptionStatus = "on_trial" | "active" | "paused" | "past_due" | "unpaid" | "cancelled" | "expired";

/** Shape of `GET /api/billing/me`'s real response (must-not-change route,
 *  read only). `entitlementReason` and `subscription.status`/`.cancelled`
 *  are the real access signals — `effectivePlan` is a *label*, verified
 *  by reading `lib/billing/entitlements.ts`'s own RPC-backed lookup to
 *  NOT be gated on current access (it can still read a paid plan name
 *  after that plan's access has fully lapsed) — this component never
 *  uses `effectivePlan` alone to decide what state to render. */
interface Subscription {
  planId: string | null;
  status: SubscriptionStatus;
  renewsAt: string | null;
  endsAt: string | null;
  trialEndsAt: string | null;
  cancelled: boolean;
  testMode: boolean;
  canManage: boolean;
}

interface BillingMe {
  effectivePlan: PlanId;
  hasPremium: boolean;
  entitlementReason: string;
  subscription: Subscription | null;
  invoices: BillingInvoice[];
}

type PortalState = { kind: "idle" } | { kind: "pending" } | { kind: "notFound" } | { kind: "error" };

export interface BillingOverviewProps {
  activeMemoriesUsed: number;
  draftsUsedThisMonth: number;
  importsUsedThisMonth: number;
}

function formatDate(value: string | null, lang: "EN" | "UA") {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(lang === "UA" ? "uk-UA" : "en-US", { dateStyle: "long" });
}

/**
 * Billing overview, integrated into the app shell (029). Every real
 * subscription state this workspace's schema can actually produce is
 * covered — verified against `lib/billing/webhook.ts`'s own
 * `normalizeSubscriptionStatus` (the exhaustive seven-value status enum)
 * and `lib/billing/entitlements.ts`'s own RPC-backed reason derivation,
 * not guessed from LEGACY's simpler inline type (which lacked the real
 * `cancelled` field entirely).
 */
export function BillingOverview({ activeMemoriesUsed, draftsUsedThisMonth, importsUsedThisMonth }: BillingOverviewProps) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).billing;
  const common = getSharedCopy(lang).common;

  const [data, setData] = useState<BillingMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [portalState, setPortalState] = useState<PortalState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/billing/me", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Portal URLs are fresh per click, never cached or rendered as a static
   * href (this prompt's own security requirement) — the response is only
   * ever handed straight to `window.location.assign`, never stored in
   * state for later reuse. A real 404 (`SUBSCRIPTION_NOT_FOUND` — the
   * "free user reaches portal anyway" edge case, here reachable only via
   * a race: `canManage` was true at load, the subscription's manageable
   * identifiers were cleared before the click) gets its own designed
   * explanation instead of a raw error.
   */
  async function openPortal() {
    if (portalState.kind === "pending") return;
    setPortalState({ kind: "pending" });
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      if (response.status === 404) {
        setPortalState({ kind: "notFound" });
        return;
      }
      const body = await response.json();
      if (!response.ok || typeof body.portalUrl !== "string") {
        setPortalState({ kind: "error" });
        return;
      }
      setPortalState({ kind: "idle" });
      window.location.assign(body.portalUrl);
    } catch {
      setPortalState({ kind: "error" });
    }
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <p className="v3-eyebrow">{t.eyebrow}</p>
        <h1 className="v3-h1">{t.title}</h1>
        <p className={styles.statusLine}>{common.loading}</p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className={styles.wrap}>
        <p className="v3-eyebrow">{t.eyebrow}</p>
        <h1 className="v3-h1">{t.title}</h1>
        <p className={styles.loadError} role="alert">
          {t.loadFailed}
        </p>
      </div>
    );
  }

  const { effectivePlan, hasPremium, entitlementReason, subscription, invoices } = data;
  const limits = getPlanLimits(effectivePlan);
  const neverSubscribed = subscription === null;
  const isPastDue = subscription?.status === "past_due";
  const isCancelledWithAccess = subscription?.status === "cancelled" && entitlementReason === "cancelled_until_end";
  const isLapsed = subscription !== null && !hasPremium && !isPastDue;

  return (
    <div className={styles.wrap}>
      <p className="v3-eyebrow">{t.eyebrow}</p>
      <h1 className="v3-h1">{t.title}</h1>

      <section className={`v3-panel ${styles.section}`} aria-labelledby="billing-plan-heading">
        <h2 id="billing-plan-heading" className={styles.sectionHeading}>
          {t.planHeading}
        </h2>
        <p className={styles.planName}>{getSharedCopy(lang).pricingPage.planNames[effectivePlan]}</p>

        {neverSubscribed && (
          <>
            <p className={styles.statusLine}>{t.neverSubscribedHeading}</p>
            <p className={styles.statusLine}>{t.neverSubscribedBody}</p>
            <div className={styles.actionsRow}>
              <Link href="/pricing" className="btn btn-primary control-focus">
                {t.chooseAPlanAction}
              </Link>
            </div>
          </>
        )}

        {subscription && (
          <>
            <p className={styles.statusLine}>
              {t.statusLabel}: {t.statusLabels[subscription.status]}
            </p>
            {subscription.status === "on_trial" && (
              <p className={styles.statusLine}>
                {t.trialEndsPrefix} {formatDate(subscription.trialEndsAt, lang)}
              </p>
            )}
            {subscription.status === "active" && (
              <p className={styles.statusLine}>
                {t.renewsPrefix} {formatDate(subscription.renewsAt, lang)}
              </p>
            )}
            {isCancelledWithAccess && (
              <p className={styles.statusLine}>
                {t.accessUntilPrefix} {formatDate(subscription.endsAt, lang)}
              </p>
            )}
            {subscription.testMode && <span className={styles.testModeNotice}>{t.testModeNotice}</span>}

            {isPastDue && (
              <div className={styles.alertPanel} role="alert">
                <p className={styles.alertHeading}>{t.pastDueHeading}</p>
                <p className={styles.alertBody}>{hasPremium ? t.pastDueGraceBody : t.pastDueLapsedBody}</p>
              </div>
            )}

            {isLapsed && !isPastDue && (
              <div className={styles.alertPanel}>
                <p className={styles.alertHeading}>{t.accessEndedHeading}</p>
                <p className={styles.alertBody}>{t.accessEndedBody}</p>
              </div>
            )}

            <div className={styles.actionsRow}>
              {isPastDue && subscription.canManage && (
                <Button onClick={() => void openPortal()} loading={portalState.kind === "pending"} disabled={portalState.kind === "pending"}>
                  {portalState.kind === "pending" ? t.managePendingLabel : t.fixPaymentAction}
                </Button>
              )}
              {!isPastDue && subscription.canManage && (
                <Button
                  variant={isCancelledWithAccess || isLapsed ? "secondary" : "primary"}
                  onClick={() => void openPortal()}
                  loading={portalState.kind === "pending"}
                  disabled={portalState.kind === "pending"}
                >
                  {portalState.kind === "pending" ? t.managePendingLabel : t.manageSubscriptionAction}
                </Button>
              )}
              {(isCancelledWithAccess || isLapsed) && (
                <Link href="/pricing" className="btn btn-primary control-focus">
                  {isCancelledWithAccess ? t.resubscribeAction : t.chooseAPlanAction}
                </Link>
              )}
            </div>

            {portalState.kind === "notFound" && (
              <p className={styles.manageError} role="alert">
                {t.manageNotFoundNotice}
              </p>
            )}
            {portalState.kind === "error" && (
              <p className={styles.manageError} role="alert">
                {t.manageErrorGeneric}
              </p>
            )}
          </>
        )}
      </section>

      <section className={`v3-panel ${styles.section}`} aria-labelledby="billing-quota-heading">
        <h2 id="billing-quota-heading" className={styles.sectionHeading}>
          {t.quotaHeading}
        </h2>
        <div className={styles.quotaRows}>
          <QuotaMeter label={t.quotaMemoriesLabel} used={activeMemoriesUsed} limit={limits.maxActiveMemories} lang={lang} />
          <QuotaMeter label={t.quotaDraftsLabel} used={draftsUsedThisMonth} limit={limits.aiDraftsPerMonth} lang={lang} />
          <QuotaMeter label={t.quotaImportsLabel} used={importsUsedThisMonth} limit={limits.importsPerMonth} lang={lang} />
        </div>
      </section>

      <section className={`v3-panel ${styles.section}`} aria-labelledby="billing-history-heading">
        <h2 id="billing-history-heading" className={styles.sectionHeading}>
          {t.historyHeading}
        </h2>
        {invoices.length === 0 && (
          <p className={styles.sectionBody}>{neverSubscribed ? t.historyEmptyFree : hasPremium ? t.historyPendingReceipt : t.historyEmptySubscribed}</p>
        )}
        <InvoiceHistoryTable invoices={invoices} lang={lang} />
      </section>
    </div>
  );
}
