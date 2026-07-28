"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { twinDemoCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import { useReducedMotionSafe } from "@/lib/motion";
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
 * No fake send button — the only control here is "Draft again" (retypes
 * the same illustrative draft), never anything that implies sending. It's a
 * `<figure>` with a `<figcaption>` stating plainly that it's an
 * illustrative example, not a live conversation (this prompt's own
 * screen-reader edge case: a labeled figure, not something read out as a
 * real chat log).
 *
 * Visual requirement: "TwinDemo sits on obsidian with the draft in
 * paper-white — the strongest light/dark contrast moment on the page" —
 * the incoming message stays a muted row on the dark ground; only the
 * draft itself flips to a bright `--altr-white` card.
 *
 * The draft message is always fully present on render — never gated behind
 * a client-only effect — so it exists for no-JS/reduced-motion visitors and
 * this section's own tests exactly as before. "Draft again" is a genuine
 * addition from the light-theme redesign: it retypes the same draft on
 * demand, purely illustrative (nothing is sent, nothing is a fake "send"
 * control) — a small, explicit affordance, not the auto-playing-on-scroll
 * animation this component deliberately avoids.
 */
export function TwinDemo() {
  const [lang] = useLang("EN");
  const t = twinDemoCopy[lang];
  const reducedMotion = useReducedMotionSafe();
  const [draft, setDraft] = useState<string>(t.draftMessage);
  const timerRef = useRef<number | undefined>(undefined);

  function typeDraft() {
    if (reducedMotion) {
      setDraft(t.draftMessage);
      return;
    }
    window.clearInterval(timerRef.current);
    setDraft("");
    let i = 0;
    timerRef.current = window.setInterval(() => {
      i += 1;
      setDraft(t.draftMessage.slice(0, i));
      if (i >= t.draftMessage.length) window.clearInterval(timerRef.current);
    }, 22);
  }

  useEffect(() => () => window.clearInterval(timerRef.current), []);

  return (
    <Surface variant="page" as="section" id="twin" className={styles.section}>
      <Reveal className={styles.intro}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-h1 font-normal text-text-heading">{t.title}</h2>
      </Reveal>

      <Reveal delay={0.1} className={styles.stage}>
        <figure className={styles.figure} aria-label={t.figureLabel}>
          <div className={styles.incoming}>
            <p className={styles.incomingLabel}>{t.incomingLabel}</p>
            <p className={styles.incomingMessage}>{t.incomingMessage}</p>
          </div>

          <div className={`${styles.draftCard} surface-inverse`}>
            <p className={styles.draftLabel}>{t.draftLabel}</p>
            <p className={styles.draftMessage}>
              {draft}
              {!reducedMotion && draft.length < t.draftMessage.length && (
                <span className={styles.caret} aria-hidden="true" />
              )}
            </p>
          </div>

          <div className={styles.footerRow}>
            <figcaption className={styles.provenance}>{t.provenance}</figcaption>
            <button type="button" className={styles.replayBtn} onClick={typeDraft}>
              {t.replay}
            </button>
          </div>
        </figure>
      </Reveal>
    </Surface>
  );
}
