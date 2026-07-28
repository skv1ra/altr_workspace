"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { howItWorksCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./HowItWorks.module.css";

/**
 * `#how-it-works` (Prompt 021): three numbered editorial movements —
 * "Bring your conversations" (local parsing / privacy), "Shape your
 * memory" (edit/disable/delete), "Meet your continuation" (reviewable
 * drafts only). Every claim is checked against FEATURE_PARITY_MATRIX's
 * COMPLETE rows — see `lib/i18n/home-copy.ts`'s own comment for the
 * specific citations.
 *
 * Large numerals + hairline rules, one column always (not just "on
 * mobile" — there's no desktop-only multi-column variant here, since a
 * 3-across grid is exactly the "card grid" DESIGN_DIRECTION and Prompt
 * 020's own ProductSection already avoided; staying consistent). Each
 * step is its own `Reveal` (a shared depth-based stagger context, see
 * `components/ui/Reveal.tsx`), so they enter in sequence rather than all
 * at once.
 */
export function HowItWorks() {
  const [lang] = useLang("EN");
  const t = howItWorksCopy[lang];

  return (
    <Surface variant="page" as="section" id="how-it-works" className={styles.section}>
      <Reveal className={styles.intro}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-h1 font-normal text-text-heading">{t.title}</h2>
      </Reveal>

      <div className={styles.steps}>
        {t.steps.map((step, index) => (
          <Reveal key={step.number} delay={index * 0.06}>
            <div className={`${styles.step} hairline-top`}>
              <span className={styles.numeral} aria-hidden="true">
                {step.number}
              </span>
              <div>
                <h3 className="text-h3 font-normal text-text-heading">{step.title}</h3>
                <p className="mt-3 max-w-[56ch] text-body text-text-muted">{step.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Surface>
  );
}
