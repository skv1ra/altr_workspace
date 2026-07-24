import type { PlanId } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./PlanBadge.module.css";

export interface PlanBadgeProps {
  plan: PlanId;
  lang: Lang;
}

/**
 * Quiet label only — reads `plan` straight from the server entitlement
 * (`getUserEntitlement` via `getProfileForUser`, both must-not-change),
 * never inferred client-side (this prompt's own security requirement).
 * `UserMenu` (029) already renders its own inline plan badge with the same
 * source of truth — not consolidated onto this component since
 * `UserMenu.tsx` is outside this prompt's own file scope; noted as a small
 * known duplication for a future cleanup pass rather than silently merged.
 */
export function PlanBadge({ plan, lang }: PlanBadgeProps) {
  return <span className={styles.badge}>{getSharedCopy(lang).pricingPage.planNames[plan]}</span>;
}
