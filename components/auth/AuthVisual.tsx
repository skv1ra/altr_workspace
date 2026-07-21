import { Surface } from "@/components/ui/Surface";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./AuthVisual.module.css";

/**
 * The auth page's obsidian side panel (Prompt 025) — "cinema-quiet, one
 * focal action": a single shard image plus one small memory-fragment
 * caption, same restrained "one shard, one fragment" language
 * `ProductSection` already established (reused here on a dark ground
 * instead of light, which is in fact the more natural home for a
 * dark-glass shard image — no visual conflict). Deliberately static, no
 * `Reveal`/scroll entrance: there's no scroll context on this page, and an
 * entrance animation would compete with the one thing that should draw
 * the eye, the form itself.
 *
 * Hidden on narrow viewports (this prompt's own "collapses to single
 * column on mobile with the form first" instruction) — LEGACY's own
 * `.auth-page` grid keeps its light visual panel *above* the form at
 * narrow widths (plain single-column stacking, no reordering), which this
 * prompt's explicit instruction overrides deliberately: the form is the
 * one actionable thing on this page, so it goes first, full-width, with no
 * decorative panel competing for scroll distance on a small screen.
 */
export function AuthVisual({ lang }: { lang: Lang }) {
  const t = getSharedCopy(lang).authPage;

  return (
    // aria-hidden: purely decorative/supplementary — the page's one real
    // heading and one real "back home" link both live in `AuthForm`, not
    // here, so this panel contains no focusable element for aria-hidden to
    // incorrectly strand a keyboard/AT user on.
    <Surface variant="inverse" as="section" className={styles.panel} aria-hidden="true">
      <div className={styles.art}>
        <picture>
          <source srcSet="/assets/hero/shards-trimmed/shard-foreground-01@1x.avif" type="image/avif" />
          <source srcSet="/assets/hero/shards-trimmed/shard-foreground-01@1x.webp" type="image/webp" />
          <img
            src="/assets/hero/shards-trimmed/shard-foreground-01@1x.png"
            alt=""
            width={481}
            height={690}
            className={styles.shardImg}
          />
        </picture>
        <div className={styles.fragment}>
          <p className={styles.fragmentKicker}>{t.fragmentKicker}</p>
          <p className={styles.fragmentLine}>{t.fragmentLine}</p>
        </div>
      </div>

      <div className={styles.copy}>
        <p className="text-label uppercase text-text-muted">{t.visualLabel}</p>
        <p className="mt-4 text-h1 font-normal text-white">{t.visualTitle}</p>
        <p className="mt-6 max-w-[46ch] text-body text-text-muted">{t.visualBody}</p>
      </div>
    </Surface>
  );
}
