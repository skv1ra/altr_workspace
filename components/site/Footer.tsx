"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentProfile } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang, type Lang } from "@/lib/i18n/lang-store";
import { openCookiePreferences } from "@/lib/legal/cookie-store";
import styles from "./Footer.module.css";

/**
 * Site footer (Prompt 024). Four columns, max 5 links each, hairline-divided
 * from the page above (`hairline-top`) and generously padded — deliberately
 * not "link soup" like LEGACY's `PremiumFooter` (which padded out a 3-column
 * layout with mostly-dead `#` links to look fuller). Social links are
 * omitted entirely (not rendered as dead `#` hrefs) when their env var isn't
 * set — see `.env.example`'s `NEXT_PUBLIC_X_URL`/`NEXT_PUBLIC_GITHUB_URL`,
 * both intentionally outside `lib/env.ts`'s Zod schemas since they're
 * optional cosmetic links, not app configuration.
 */
export function Footer() {
  const [lang, setLang] = useLang("EN");
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

  const xUrl = process.env.NEXT_PUBLIC_X_URL;
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;

  return (
    <footer className={`${styles.footer} hairline-top surface-inverse`}>
      <div className={styles.grid}>
        <div className={styles.brandCol}>
          {/* Not `Logo` — that component hardcodes obsidian-on-light fill/text
              for the header's own transparent-over-hero context and would be
              invisible against this footer's dark ground. This mark uses
              `currentColor`, inheriting `surface-inverse`'s white `--text-primary`. */}
          <Link href="/" aria-label="Altr home" className={styles.brandMark}>
            <svg aria-hidden="true" width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 0L1 18H9V0Z" fill="currentColor" />
              <path d="M9 0L17 18H9V0Z" fill="currentColor" opacity="0.55" />
            </svg>
            <span>Altr</span>
          </Link>
          <p className={`${styles.copyright} text-body text-text-muted`}>{t.footer.copyright}</p>
        </div>

        <nav aria-label={t.nav.product} className={styles.col}>
          <p className={styles.heading}>{t.nav.product}</p>
          <Link href="/#product" className={styles.link}>{t.nav.product}</Link>
          <Link href="/#how-it-works" className={styles.link}>{t.nav.howItWorks}</Link>
          <Link href="/pricing" className={styles.link}>{t.nav.pricing}</Link>
        </nav>

        <nav aria-label={t.footer.legalHeading} className={styles.col}>
          <p className={styles.heading}>{t.footer.legalHeading}</p>
          <Link href="/privacy" className={styles.link}>{t.footer.privacyLink}</Link>
          <Link href="/terms" className={styles.link}>{t.footer.termsLink}</Link>
          <Link href="/cookies" className={styles.link}>{t.footer.cookiesLink}</Link>
          <button type="button" onClick={openCookiePreferences} className={`${styles.link} ${styles.linkButton}`}>
            {t.footer.cookiePreferences}
          </button>
        </nav>

        <nav aria-label={t.footer.accountHeading} className={styles.col}>
          <p className={styles.heading}>{t.footer.accountHeading}</p>
          <Link href={signedIn ? "/dashboard" : "/auth?mode=login"} className={styles.link}>
            {signedIn ? t.common.backDashboard : t.nav.login}
          </Link>
          {!signedIn && (
            <Link href="/auth?mode=register" className={styles.link}>{t.nav.createAltr}</Link>
          )}
        </nav>

        <div className={styles.col}>
          <p className={styles.heading} aria-hidden="true">{t.nav.language}</p>
          <div className={styles.langRow} aria-label={t.nav.language}>
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
          {(xUrl || githubUrl) && (
            <div className={styles.socialRow}>
              {xUrl && (
                <a href={xUrl} target="_blank" rel="noreferrer noopener" className={styles.socialLink} aria-label="X">
                  <Twitter aria-hidden="true" width={16} height={16} strokeWidth={1.5} />
                </a>
              )}
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noreferrer noopener" className={styles.socialLink} aria-label="GitHub">
                  <Github aria-hidden="true" width={16} height={16} strokeWidth={1.5} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
