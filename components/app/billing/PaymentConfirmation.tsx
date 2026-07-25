"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { Body, Display, Label } from "@/components/ui/Text";
import type { PlanId } from "@/lib/billing/types";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./PaymentConfirmation.module.css";

const POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3_000;

/** Shape of the one field this component reads from `GET /api/billing/me`
 *  (must-not-change, real, already-working route) — `hasPremium` is the
 *  only real access signal (see 042's own finding: `effectivePlan` is a
 *  label, not a gate), `subscription` is read only to decide *wording*
 *  once polling times out, never to display a plan/access claim of its
 *  own. */
interface BillingState {
  effectivePlan: string;
  hasPremium: boolean;
  subscription: unknown | null;
}

type ConfirmState =
  | { kind: "pending" }
  | { kind: "confirmed"; plan: string }
  | { kind: "timeoutStillPending" }
  | { kind: "timeoutNoPending" };

/**
 * Polling logic reused verbatim from LEGACY's own `PaymentConfirmation.tsx`
 * (`app/payment/success/PaymentConfirmation.tsx` @ pinned `a22927d`): 10
 * attempts, 3-second interval, a `stopped` flag for cleanup, one real
 * `GET /api/billing/me` call per attempt — this prompt's own instruction
 * #1 says to preserve this exactly, and it's the one part of this
 * component that was never rewritten, only restyled and given two new,
 * genuinely distinguishable end states instead of LEGACY's single
 * indefinite "still confirming" copy.
 *
 * **Timeout split, grounded in real data, not guessed:** `GET /api/
 * billing/me` has no "checkout in progress" flag of its own (verified by
 * reading the route in full during 042/043) — there is no reliable way
 * to distinguish "a real webhook just hasn't arrived yet" from "this page
 * was visited directly, nothing was ever purchased" within the first few
 * seconds, since a genuine in-flight purchase *also* shows
 * `subscription: null` until its own webhook lands. After the full
 * (unchanged) 30-second poll window, though, `subscription === null`
 * becomes a meaningful signal: a real purchase almost always produces a
 * subscription/order row well within that window, even before the
 * status finalizes to active — so a still-null subscription after 30s is
 * read as "nothing pending" (`timeoutNoPending`, this prompt's own edge
 * case), while a real-but-unresolved subscription row after 30s gets the
 * separate "taking longer, not a failure" copy (`timeoutStillPending`).
 * Both are the honest *timeout* state under this prompt's own instruction
 * #1 — this is a difference in wording grounded in real data, not two
 * independently-invented states.
 *
 * No "contact support" action anywhere — `lib/legal/legal-config.ts`'s
 * `SUPPORT_EMAIL` is still an unresolved placeholder (checked before
 * writing this), so every "still not resolved" path instead points at
 * the real, already-working `/billing` page (042).
 */
export function PaymentConfirmation() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).paymentReturn;
  const planNames = getSharedCopy(lang).pricingPage.planNames;

  const [state, setState] = useState<ConfirmState>({ kind: "pending" });
  const [refreshing, setRefreshing] = useState(false);
  const lastSubscriptionNull = useRef(true);

  const check = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/me", { cache: "no-store" });
      if (!response.ok) return false;
      const body = (await response.json()) as BillingState;
      lastSubscriptionNull.current = body.subscription === null;
      if (body.hasPremium) {
        setState({ kind: "confirmed", plan: body.effectivePlan });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let attempt = 0;
    const poll = async () => {
      if (stopped) return;
      const confirmed = await check();
      if (confirmed || stopped) return;
      attempt += 1;
      if (attempt >= POLL_ATTEMPTS) {
        setState(lastSubscriptionNull.current ? { kind: "timeoutNoPending" } : { kind: "timeoutStillPending" });
        return;
      }
      window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
    };
    void poll();
    return () => {
      stopped = true;
    };
  }, [check]);

  async function handleRefresh() {
    setRefreshing(true);
    await check();
    setRefreshing(false);
  }

  const confirmed = state.kind === "confirmed";

  return (
    <Surface variant="inverse" className={confirmed ? `${styles.panel} ${styles.panelConfirmed}` : styles.panel}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        {confirmed ? (
          <CheckCircle2 aria-hidden="true" width={48} height={48} strokeWidth={1.4} className={`${styles.icon} ${styles.iconConfirmed}`} />
        ) : (
          <Loader2 aria-hidden="true" width={48} height={48} strokeWidth={1.4} className={`${styles.icon} animate-spin`} />
        )}
        <Label className={styles.eyebrow}>{t.successEyebrow}</Label>

        {state.kind === "pending" && (
          <>
            <Display as="h1" className={styles.heading}>
              {t.pendingHeading}
            </Display>
            <Body muted className={styles.body}>
              {t.pendingBody}
            </Body>
          </>
        )}

        {confirmed && (
          <>
            <Display as="h1" className={styles.heading}>
              {t.confirmedHeadingPrefix} {planNames[state.plan as PlanId] ?? state.plan} {t.confirmedHeadingSuffix}
            </Display>
            <Body muted className={styles.body}>
              {t.confirmedBody}
            </Body>
          </>
        )}

        {state.kind === "timeoutStillPending" && (
          <>
            <Display as="h1" className={styles.heading}>
              {t.timeoutStillPendingHeading}
            </Display>
            <Body muted className={styles.body}>
              {t.timeoutStillPendingBody}
            </Body>
          </>
        )}

        {state.kind === "timeoutNoPending" && (
          <>
            <Display as="h1" className={styles.heading}>
              {t.timeoutNoPendingHeading}
            </Display>
            <Body muted className={styles.body}>
              {t.timeoutNoPendingBody}
            </Body>
          </>
        )}

        <div className={styles.actions}>
          {!confirmed && (
            <Button variant="secondary" onClick={() => void handleRefresh()} loading={refreshing} disabled={refreshing}>
              {refreshing ? t.refreshingLabel : t.refreshAction}
            </Button>
          )}
          <Link href={confirmed ? "/dashboard" : "/billing"} className="btn btn-primary control-focus">
            {confirmed ? t.goToDashboardAction : t.openBillingAction}
          </Link>
        </div>
      </div>
    </Surface>
  );
}
