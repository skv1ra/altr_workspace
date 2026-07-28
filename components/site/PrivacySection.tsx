"use client";

import Link from "next/link";
import { ArrowRight, Laptop, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { privacySectionCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./PrivacySection.module.css";

const GLYPHS = [Laptop, Lock, ShieldCheck, UserCheck];

/**
 * Privacy section (Prompt 022): only verified guarantees, one sentence
 * each with a quiet glyph — no card grid (plain rows, hairline-divided,
 * same discipline as `HowItWorks`/`MemoryDemo`). Every sentence is
 * traceable to a specific MASTER_CONTEXT.md security invariant and/or
 * real code — see `lib/i18n/home-copy.ts`'s own comment on
 * `privacySectionCopy` and STATUS.md's guarantee-to-evidence mapping
 * table. The suggested "no training on your data" guarantee was checked
 * and deliberately left out as unverifiable in this codebase, per this
 * prompt's own instruction — four guarantees here, not five.
 *
 * "Section links: privacy -> /privacy" — that page doesn't exist in this
 * workspace yet (no `app/privacy/page.tsx`; only the `app/api/privacy/*`
 * routes are ported) — linked anyway, per this prompt's own literal
 * instruction, and tracked in STATUS.md's dead-link ledger alongside
 * `/pricing`/`/auth` from 020/021. "Security detail: keep on-page" is
 * satisfied by the guarantee sentences themselves; there's no separate
 * on-page detail expansion beyond them.
 */
export function PrivacySection() {
  const [lang] = useLang("EN");
  const t = privacySectionCopy[lang];

  return (
    <Surface variant="page" as="section" id="privacy" className={styles.section}>
      <Reveal className={styles.intro}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-h1 font-normal text-text-heading">{t.title}</h2>
      </Reveal>

      <Reveal delay={0.1} className={styles.list}>
        <ul>
          {t.guarantees.map((guarantee, index) => {
            const Glyph = GLYPHS[index];
            return (
              <li key={guarantee.title} className={`${styles.row} hairline-top`}>
                <Glyph aria-hidden="true" className={styles.glyph} width={20} height={20} strokeWidth={1.5} />
                <div>
                  <p className={`text-body font-medium text-text-heading ${styles.rowTitle}`}>{guarantee.title}</p>
                  <p className="mt-1 text-body text-text-muted">{guarantee.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>

      <Reveal delay={0.16} className={styles.linkRow}>
        <Link href="/privacy" className={`text-body ${styles.privacyLink}`}>
          {t.privacyLink}
          <ArrowRight aria-hidden="true" className={styles.linkArrow} width={16} height={16} strokeWidth={1.5} />
        </Link>
      </Reveal>
    </Surface>
  );
}
