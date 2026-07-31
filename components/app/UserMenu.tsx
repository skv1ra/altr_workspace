"use client";

import { Languages, Moon, Sun } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import type { PlanId } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang, type Lang } from "@/lib/i18n/lang-store";
import { useTheme } from "@/lib/theme/theme-store";
import styles from "./UserMenu.module.css";

export interface UserMenuProps {
  name: string;
  email: string;
  plan: PlanId;
}

/**
 * A persistent identity block, not a click-to-open dropdown — see this
 * file's original comment (still true) for why the shared `Menu` primitive
 * doesn't fit a language/theme toggle or `SignOutButton`'s own pending
 * state. Restyled to Altr App v3's vertical row list (identity, then one
 * full-width row per control) instead of the previous inline pill pair;
 * each row shows the *other* state as its label ("Light mode" while dark,
 * "Українська" while EN) rather than a two-way toggle, matching the design.
 */
export function UserMenu({ name, email, plan }: UserMenuProps) {
  const [lang, setLang] = useLang("EN");
  const [theme, setTheme] = useTheme("dark");
  const t = getSharedCopy(lang);
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  const otherLang: Lang = lang === "EN" ? "UA" : "EN";

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
      </div>
      <p className={styles.plan}>{t.pricingPage.planNames[plan]}</p>

      <div className={styles.controls}>
        <button type="button" className={styles.row} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? (
            <Sun aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          ) : (
            <Moon aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          )}
          <span>{theme === "dark" ? t.nav.switchToLight : t.nav.switchToDark}</span>
        </button>

        <button type="button" className={styles.row} onClick={() => setLang(otherLang)}>
          <Languages aria-hidden="true" width={16} height={16} strokeWidth={1.6} />
          <span>{t.nav.switchToLanguage}</span>
        </button>

        <SignOutButton variant="ghost" className={styles.row} />
      </div>
    </div>
  );
}
