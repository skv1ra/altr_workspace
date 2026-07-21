"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { knownPlanDisplay, type PaidPlanId, type PlanId } from "@/lib/billing/plans";
import { PLAN_LIMITS, type PlanLimits } from "@/lib/billing/limits";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./PricingTable.module.css";

const PLAN_ORDER: PlanId[] = ["free", "personal", "work"];

interface LivePlanEntry {
  planId: PaidPlanId;
  amount: number;
  currency: string;
  interval: string | null;
  live: boolean;
}

interface BillingMeResponse {
  effectivePlan: PlanId;
}

export interface PricingTableProps {
  /**
   * Test-only injection point ("RTL: PricingTable renders limits from
   * injected plan data" — this prompt's own required test). When
   * provided, the component skips its own live fetches entirely and
   * renders with this data directly, so tests stay deterministic without
   * mocking `fetch`.
   */
  injectedPlans?: LivePlanEntry[];
  injectedMe?: BillingMeResponse | null;
}

function formatBytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

/**
 * Three editorial pricing columns (Prompt 023) — plan name, price, a
 * one-line positioning sentence, the real limits from `PLAN_LIMITS`
 * (`lib/billing/limits.ts`, read-only, imported directly — never
 * hardcoded here), and a CTA. No rounded cards, no "most popular"
 * badge — Personal is visually primary through typographic weight alone
 * (`.personal` in `PricingTable.module.css`), per this prompt's own
 * visual requirement.
 *
 * Preserves the exact LEGACY-audited contract this prompt names: `GET
 * /api/billing/plans` (public, live pricing with a `live`/fallback
 * flag), `GET /api/billing/me` (auth-gated, current `effectivePlan`),
 * `POST /api/billing/checkout` with `{ planId }` only. Amounts always
 * come from `lib/billing/plans.ts`'s `knownPlanDisplay` (the canonical
 * fallback) or the live `/api/billing/plans` response — never
 * hardcoded/duplicated here.
 *
 * Also renders the page's own eyebrow/title/subtitle (not just the three
 * columns) — a first pass left that intro in `app/(public)/pricing/page.tsx`
 * as static server-rendered English text, which meant switching to UA
 * translated the columns but left the heading in English (caught with a
 * real screenshot, not assumed). Moved in here so the whole page reacts
 * to the same `useLang()` state as one unit.
 */
export function PricingTable({ injectedPlans, injectedMe }: PricingTableProps) {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).pricingPage;

  const [livePlans, setLivePlans] = useState<LivePlanEntry[] | null>(injectedPlans ?? null);
  const [plansUnavailable, setPlansUnavailable] = useState(false);
  const [me, setMe] = useState<BillingMeResponse | null | undefined>(injectedMe);
  const [checkoutErrorPlan, setCheckoutErrorPlan] = useState<PaidPlanId | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PaidPlanId | null>(null);

  useEffect(() => {
    if (injectedPlans) return;
    let active = true;
    fetch("/api/billing/plans")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("PLANS_UNAVAILABLE"))))
      .then((data: { plans: LivePlanEntry[] }) => {
        if (active) setLivePlans(data.plans);
      })
      .catch(() => {
        if (active) setPlansUnavailable(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (injectedMe !== undefined) return;
    let active = true;
    // Any non-2xx (including the 500 `/api/billing/me` currently returns
    // for an anonymous request — a real, pre-existing mismatch against
    // its own `message === "UNAUTHORIZED"` check, since `requireUser()`
    // actually throws `AUTH_REQUIRED`; not fixed here, `app/api/billing/**`
    // is out of this prompt's allowed files) is treated as "not signed
    // in", the same robust-to-any-failure convention `Header`'s own
    // `getCurrentProfile()` already established.
    fetch("/api/billing/me")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("ME_UNAVAILABLE"))))
      .then((data: BillingMeResponse) => {
        if (active) setMe(data);
      })
      .catch(() => {
        if (active) setMe(null);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retryPlans() {
    setPlansUnavailable(false);
    fetch("/api/billing/plans")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("PLANS_UNAVAILABLE"))))
      .then((data: { plans: LivePlanEntry[] }) => setLivePlans(data.plans))
      .catch(() => setPlansUnavailable(true));
  }

  async function startCheckout(planId: PaidPlanId) {
    setCheckoutErrorPlan(null);
    setPendingPlan(planId);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error("CHECKOUT_FAILED");
      window.location.href = data.checkoutUrl;
    } catch {
      setCheckoutErrorPlan(planId);
      setPendingPlan(null);
    }
  }

  function amountFor(planId: PlanId): number {
    if (planId === "free") return 0;
    const live = livePlans?.find((plan) => plan.planId === planId);
    if (live) return live.amount;
    return knownPlanDisplay[planId].amount;
  }

  const limitRows: Array<{ key: keyof PlanLimits; label: string; format: (limits: PlanLimits) => string }> = [
    { key: "importsPerMonth", label: t.limitLabels.importsPerMonth, format: (l) => formatNumber(l.importsPerMonth) },
    { key: "maxFileBytes", label: t.limitLabels.maxFileBytes, format: (l) => formatBytes(l.maxFileBytes) },
    { key: "maxActiveMemories", label: t.limitLabels.maxActiveMemories, format: (l) => formatNumber(l.maxActiveMemories) },
    { key: "aiDraftsPerMonth", label: t.limitLabels.aiDraftsPerMonth, format: (l) => formatNumber(l.aiDraftsPerMonth) },
  ];

  return (
    <div>
      <div className={styles.intro}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h1 className="mt-4 text-h1 font-normal text-altr-obsidian">{t.title}</h1>
        <p className="mt-4 text-body text-text-muted">{t.subtitle}</p>
      </div>

      {plansUnavailable && (
        <p className={styles.notice} role="status">
          {t.plansUnavailable}{" "}
          <button type="button" onClick={retryPlans} className={styles.retryLink}>
            {t.retry}
          </button>
        </p>
      )}

      <div className={styles.grid}>
        {PLAN_ORDER.map((planId) => {
          const limits = PLAN_LIMITS[planId];
          const price = amountFor(planId) / 100;
          const isPaid = planId !== "free";
          const isCurrentPlan = me != null && me.effectivePlan === planId;

          return (
            <div
              key={planId}
              className={planId === "personal" ? `${styles.column} ${styles.personal}` : styles.column}
            >
              <p className="text-label uppercase text-text-muted">{t.planNames[planId]}</p>
              <p className={styles.price}>
                {price === 0 ? "$0" : `$${price}`}
                {isPaid && <span className={styles.perMonth}>{t.perMonth}</span>}
              </p>
              <p className="mt-3 text-body text-text-muted">{t.positioning[planId]}</p>

              <dl className={styles.limits}>
                {limitRows.map((row) => (
                  <div key={row.key} className={styles.limitRow}>
                    <dt className="text-label uppercase text-text-muted">{row.label}</dt>
                    <dd className="text-body font-medium text-altr-obsidian">{row.format(limits)}</dd>
                  </div>
                ))}
              </dl>

              <div className={styles.ctaRow}>
                {isCurrentPlan ? (
                  <span className={styles.yourPlan}>{t.yourPlan}</span>
                ) : !isPaid ? (
                  me === null ? (
                    <Link href="/auth?mode=register" className="btn control-focus btn-primary">
                      {t.ctaRegister}
                    </Link>
                  ) : (
                    <span className="text-body text-text-muted">{t.freeIncluded}</span>
                  )
                ) : me === null ? (
                  <Link href="/auth?next=/pricing" className="btn control-focus btn-primary">
                    {t.ctaCheckout}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn control-focus btn-primary"
                    disabled={plansUnavailable || pendingPlan === planId}
                    onClick={() => startCheckout(planId as PaidPlanId)}
                  >
                    {t.ctaCheckout}
                  </button>
                )}
              </div>
              {isPaid && checkoutErrorPlan === planId && (
                <p className={styles.errorNote} role="alert">
                  {t.checkoutError}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.footnotes}>
        <p className="text-body text-text-muted">{t.footnoteCancellation}</p>
        <p className="mt-2 text-body text-text-muted">{t.footnoteRefunds}</p>
      </div>
    </div>
  );
}
