"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/Dialog";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./MobileMenu.module.css";

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  signedIn: boolean;
}

const NAV_LINKS = [
  { href: "/#product", key: "product" as const },
  { href: "/#how-it-works", key: "howItWorks" as const },
  { href: "/pricing", key: "pricing" as const },
];

/**
 * Full-screen mobile nav overlay. Built on the shared `Dialog` primitive
 * (Prompt 010) rather than a bespoke implementation — this prompt's own
 * instruction is "using Dialog primitives", and `Dialog` already owns the
 * portal, focus trap, Escape-to-close, backdrop-click-to-close, and
 * body-scroll-lock this prompt separately asks for, so re-implementing any
 * of that here would just be a second, divergent copy of the same
 * accessibility logic.
 *
 * `Dialog`'s own panel styling (`dialog-panel`) is a centered ~480px card
 * by default — deliberately overridden here (`className="mobile-menu-panel"`,
 * Header.module.css) to a full-bleed, full-height sheet instead, since a
 * "full-screen quiet overlay" is this prompt's own explicit visual
 * requirement, not a centered modal.
 */
export function MobileMenu({ open, onClose, lang, setLang, signedIn }: MobileMenuProps) {
  const t = getSharedCopy(lang);

  return (
    <Dialog open={open} onClose={onClose} title={t.nav.menuTitle} className={styles.panel}>
      <nav aria-label="Primary" className="flex flex-col gap-8">
        <ul className="flex flex-col gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onClose}
                className="text-h3 font-normal text-text-heading"
              >
                {t.nav[link.key]}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={signedIn ? "/dashboard" : "/auth?mode=login"}
          onClick={onClose}
          className="text-h3 font-normal text-text-heading"
        >
          {signedIn ? t.common.backDashboard : t.nav.login}
        </Link>

        <Link
          href="/auth?mode=register"
          onClick={onClose}
          className="btn control-focus btn-primary w-fit"
        >
          {t.nav.createAltr}
        </Link>

        <div className="flex items-center gap-3 pt-4" aria-label={t.nav.language}>
          {(["EN", "UA"] as Lang[]).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
              className="text-label uppercase text-text-muted aria-pressed:text-text-heading"
            >
              {code}
            </button>
          ))}
        </div>
      </nav>
    </Dialog>
  );
}
