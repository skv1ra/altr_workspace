"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { productCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./ProductSection.module.css";

/**
 * `#product` — the second viewport of the new landing (Prompt 020):
 * editorial explanation of Altr (imports -> memory -> Twin drafts), one
 * restrained visual (a single shard, one small memory-fragment caption),
 * no card grid, no icon rows — per this prompt's own visual requirement
 * and DESIGN_DIRECTION's "forbidden: ... rounded-card grids" rule. The
 * three "beats" below are plain labeled paragraphs in a single column,
 * not boxed cards.
 *
 * Continues the hero's fog atmosphere (`Surface variant="fog"`, same
 * decorative/pointer-events:none recipe the styleguide's own fog example
 * uses) rather than cutting to a flat white background, per this prompt's
 * "continues the fog atmosphere without competing with the hero" visual
 * requirement.
 *
 * "use client" only for `useLang()` (reads the same shared localStorage/
 * cross-tab-sync `lang-store.ts` state `Header` uses, so switching
 * language in the header updates this section too, independently, via
 * the same `altr-language-change` event both components listen for) — all
 * real content is still rendered synchronously on the initial pass
 * (`useLang`'s own default is `"EN"`, corrected client-side only if a
 * stored preference differs), and `Reveal`'s own entrance animation has a
 * `<noscript>` fallback (see `components/ui/Reveal.tsx`), so nothing here
 * is ever gated behind a client mount for its *content* to exist.
 */
export function ProductSection() {
  const [lang] = useLang("EN");
  const t = productCopy[lang];

  return (
    <Surface
      variant="page"
      as="section"
      id="product"
      className={`${styles.section} relative overflow-hidden`}
    >
      <Surface variant="fog" aria-hidden="true" />
      <div className={`${styles.grid} relative`}>
        <Reveal>
          <p className="text-label uppercase text-iris-violet">{t.eyebrow}</p>
          <h2 className="mt-4 max-w-2xl text-h1 font-normal text-text-heading">{t.title}</h2>
          <p className="mt-6 max-w-[52ch] text-body text-text-muted">{t.body}</p>

          <dl className="mt-10 max-w-[52ch] space-y-6">
            {t.beats.map((beat) => (
              <div key={beat.label} className="hairline-top pt-6">
                <dt className="text-label uppercase text-text-muted">{beat.label}</dt>
                <dd className="mt-2 text-body text-text-primary">{beat.body}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.12} className={`${styles.visual} ${styles.visualLift}`}>
          <div className={styles.glow} aria-hidden="true" />
          <picture>
            <source srcSet="/assets/hero/shards-trimmed/shard-mid-02@1x.avif" type="image/avif" />
            <source srcSet="/assets/hero/shards-trimmed/shard-mid-02@1x.webp" type="image/webp" />
            <img
              src="/assets/hero/shards-trimmed/shard-mid-02@1x.png"
              alt=""
              width={481}
              height={690}
              loading="lazy"
              className={styles.shardImg}
            />
          </picture>
          <div className={styles.fragment} aria-hidden="true">
            <p className={styles.fragmentKicker}>{t.fragmentKicker}</p>
            <p className={styles.fragmentLine}>{t.fragmentLine}</p>
            <p className={styles.fragmentNote}>{t.fragmentNote}</p>
          </div>
        </Reveal>
      </div>
    </Surface>
  );
}
