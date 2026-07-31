"use client";

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
 * Exact Altr App v3 bottom-of-rail block: name + plan text, then a plain
 * vertical list of quiet text rows (theme, language, sign out) — no
 * avatar circle, matching the design's own markup (`<div style="display:
 * flex;flex-direction:column;gap:14px;align-items:flex-start">` containing
 * only the name/plan `<p>`s, confirmed by inspecting the live bundle's
 * rendered DOM, not guessed). `email` is kept in the `title` attribute for
 * a hover/AT reveal — dropped from the visible layout to match, not lost
 * from the DOM.
 */
export function UserMenu({ name, email, plan }: UserMenuProps) {
  const [lang, setLang] = useLang("EN");
  const [theme, setTheme] = useTheme("dark");
  const t = getSharedCopy(lang);
  const otherLang: Lang = lang === "EN" ? "UA" : "EN";

  return (
    <div className={styles.wrap}>
      <div>
        <p className={styles.name} title={email}>
          {name}
        </p>
        <p className={styles.plan}>{t.pricingPage.planNames[plan]}</p>
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.row} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? t.nav.switchToLight : t.nav.switchToDark}
        </button>

        <button type="button" className={styles.row} onClick={() => setLang(otherLang)}>
          {t.nav.switchToLanguage}
        </button>

        <SignOutButton variant="ghost" className={styles.row} />
      </div>
    </div>
  );
}
