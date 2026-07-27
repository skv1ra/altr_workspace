"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getCurrentProfile } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang, type Lang } from "@/lib/i18n/lang-store";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { href: "/#product", key: "product" as const },
  { href: "/#how-it-works", key: "howItWorks" as const },
  { href: "/pricing", key: "pricing" as const },
];

/** Matches this prompt's own "after 24px scroll" instruction exactly. */
const SCROLL_BACKDROP_THRESHOLD_PX = 24;

/**
 * Premium public header (Prompt 019): shard-glyph wordmark (`Logo`), the
 * four reference nav labels plus a compact "Create your Altr" CTA, a
 * language switch, and a full-screen mobile overlay (`MobileMenu`).
 *
 * Transparent over the hero by default (`position: fixed`, no background) —
 * gains a fog-blur backdrop + bottom hairline once the page scrolls past
 * 24px (`.scrolled` in Header.module.css). Compositor-friendly: only
 * `opacity` is animated (the backdrop layer is always mounted, just
 * invisible at opacity 0 below the threshold), never a layout-affecting
 * property, and the scroll listener itself is passive and only ever
 * flips a boolean (no per-frame work, no rAF needed at this fidelity —
 * unlike the hero's own scroll choreography, this is a single threshold
 * crossing, not a continuous value).
 *
 * Nothing here ever blocks on the hero or on the auth check: nav links,
 * logo, and CTA render immediately from the initial (logged-out) state;
 * `getCurrentProfile()` (reads `/api/me`, this repo's own established
 * pattern — see `lib/auth.ts`) resolves asynchronously and only then may
 * swap "Log in" for "Dashboard". A failed/offline check resolves to `null`
 * inside `getCurrentProfile` itself (try/catch around the fetch), so the
 * logged-out UI is also this component's correct offline fallback, not a
 * separate code path.
 */
export function Header() {
  const [lang, setLang] = useLang("EN");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const t = getSharedCopy(lang);

  useEffect(() => {
    let active = true;
    const sync = () => {
      void getCurrentProfile().then((profile) => {
        if (active) setSignedIn(Boolean(profile));
      });
    };
    sync();
    window.addEventListener("altr-auth-change", sync);
    return () => {
      active = false;
      window.removeEventListener("altr-auth-change", sync);
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_BACKDROP_THRESHOLD_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className={styles.header}>
      <div className={scrolled ? `${styles.backdrop} ${styles.backdropScrolled}` : styles.backdrop} aria-hidden="true" />
      <nav aria-label="Primary" className={styles.bar}>
        <Logo />

        <div className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-label uppercase text-text-muted transition-colors hover:text-text-primary"
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-3 lg:flex" aria-label={t.nav.language}>
            {(["EN", "UA"] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
                className="text-label uppercase text-text-muted transition-colors hover:text-text-primary aria-pressed:text-text-heading"
              >
                {code}
              </button>
            ))}
          </div>

          <Link
            href={signedIn ? "/dashboard" : "/auth?mode=login"}
            className="hidden whitespace-nowrap text-label uppercase text-text-muted transition-colors hover:text-text-primary lg:inline"
          >
            {signedIn ? t.common.backDashboard : t.nav.login}
          </Link>

          <Link
            href="/auth?mode=register"
            className="btn control-focus btn-primary hidden whitespace-nowrap lg:inline-flex"
          >
            {t.nav.createAltr}
          </Link>

          <button
            type="button"
            className="control-focus lg:hidden"
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2.5 5.5H17.5M2.5 10H17.5M2.5 14.5H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      <MobileMenu open={menuOpen} onClose={closeMenu} lang={lang} setLang={setLang} signedIn={signedIn} />
    </header>
  );
}
