"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";
import type { PlanId } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang, type Lang } from "@/lib/i18n/lang-store";
import styles from "./UserMenu.module.css";

export interface UserMenuProps {
  name: string;
  email: string;
  plan: PlanId;
}

/**
 * A persistent identity block, not a click-to-open dropdown, despite the
 * name this prompt asks for — the shared `Menu` primitive
 * (`components/ui/Menu.tsx`) models a list of `{ id, label, onSelect }`
 * actions behind a single trigger button, which doesn't fit a language
 * toggle (two simultaneously-visible pressed-state buttons) or
 * `SignOutButton` (its own pending/spinner state, not a plain onSelect
 * callback) without flattening both into something they're not. LEGACY's
 * own `AppShell.tsx` reference (never wired into a route, but read for
 * this prompt) made the same call — `app-sidebar-profile` is a persistent
 * block at the bottom of the rail, not a disclosure. Keeping it always
 * visible also means every control here is already in the natural tab
 * order with no extra keyboard affordance needed.
 *
 * `email`/`name` are untruncated server data — `truncate` here (this
 * prompt's own "long names/emails" edge case) is purely a CSS overflow
 * treatment, never a data-loss one; the full string is still in the DOM
 * and in the `title` attribute for a hover/AT reveal.
 */
export function UserMenu({ name, email, plan }: UserMenuProps) {
  const [lang, setLang] = useLang("EN");
  const t = getSharedCopy(lang);
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className={styles.wrap}>
      <div className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true">
          {initial}
        </span>
        <span className={styles.text}>
          <strong className={styles.name} title={name}>
            {name}
          </strong>
          <span className={styles.email} title={email}>
            {email}
          </span>
        </span>
        <span className={styles.planBadge}>{t.pricingPage.planNames[plan]}</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.langSwitch} aria-label={t.nav.language}>
          {(["EN", "UA"] as Lang[]).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
              className={styles.langButton}
            >
              {code}
            </button>
          ))}
        </div>
        <SignOutButton className={styles.signOut} />
      </div>
    </div>
  );
}
