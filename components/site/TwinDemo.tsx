"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { twinDemoCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./TwinDemo.module.css";

/**
 * Twin demonstration (Prompt 022): a single static, composed moment —
 * fictional incoming message, the Twin's draft beneath it, and a faint
 * provenance line. Matches what `app/api/ai/draft-reply` actually
 * returns/enforces (a `status: "draft"` string, never "sent" — see
 * `lib/i18n/home-copy.ts`'s own comment on `twinDemoCopy`), and this
 * prompt's own required literal label, "Draft — you decide what sends",
 * is always visible, never conditional.
 *
 * No fake send button anywhere — nothing in this component is a
 * `<button>` or carries an interactive role; it's a `<figure>` with a
 * `<figcaption>` stating plainly that it's an illustrative example, not a
 * live conversation (this prompt's own screen-reader edge case: a
 * labeled figure, not something read out as a real chat log).
 *
 * Visual requirement: "TwinDemo sits on obsidian with the draft in
 * paper-white — the strongest light/dark contrast moment on the page" —
 * the incoming message stays a muted row on the dark ground; only the
 * draft itself flips to a bright `--altr-white` card.
 *
 * No animation (typing reveal, etc.) — this prompt allows one but doesn't
 * require it, and a static composition needs no reduced-motion handling
 * of its own beyond `Reveal`'s already-proven entrance (same mechanism
 * `ProductSection`/`HowItWorks`/`MemoryDemo` already use).
 */
export function TwinDemo() {
  const [lang] = useLang("EN");
  const t = twinDemoCopy[lang];

  return (
    <Surface variant="inverse" as="section" id="twin" className={styles.section}>
      <Reveal className={styles.intro}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-h1 font-normal text-text-primary">{t.title}</h2>
      </Reveal>

      <Reveal delay={0.1} className={styles.stage}>
        <figure className={styles.figure} aria-label={t.figureLabel}>
          <div className={styles.incoming}>
            <p className={styles.incomingLabel}>{t.incomingLabel}</p>
            <p className={styles.incomingMessage}>{t.incomingMessage}</p>
          </div>

          <div className={styles.draftCard}>
            <p className={styles.draftLabel}>{t.draftLabel}</p>
            <p className={styles.draftMessage}>{t.draftMessage}</p>
          </div>

          <figcaption className={styles.provenance}>{t.provenance}</figcaption>
        </figure>
      </Reveal>
    </Surface>
  );
}
