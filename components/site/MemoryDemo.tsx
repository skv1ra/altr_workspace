"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { memoryDemoCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import { useReducedMotionSafe } from "@/lib/motion";
import styles from "./MemoryDemo.module.css";

const POSITIONS = [
  { left: "18%", top: "14%" },
  { left: "80%", top: "20%" },
  { left: "12%", top: "76%" },
  { left: "82%", top: "78%" },
];

/**
 * Memory demonstration, light-theme redesign. A hub-and-spoke visual (four
 * lines converging on a center status line that types through `ui.lines`)
 * sits above the real memory list as purely decorative framing — it carries
 * no unique memory text of its own (`aria-hidden`), so the hairline list
 * below it remains the one accessible, real source of the memory data on
 * every viewport and for reduced-motion users, unchanged from before this
 * redesign.
 */
export function MemoryDemo() {
  const [lang] = useLang("EN");
  const t = memoryDemoCopy[lang];
  const reducedMotion = useReducedMotionSafe();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (reducedMotion) {
      setTyped(t.ui.lines[0]);
      return;
    }
    let lineIndex = 0;
    let charIndex = 0;
    let phase: "typing" | "holding" | "erasing" = "typing";
    let holdTicks = 0;
    const timer = window.setInterval(() => {
      const line = t.ui.lines[lineIndex];
      if (phase === "typing") {
        charIndex += 1;
        setTyped(line.slice(0, charIndex));
        if (charIndex >= line.length) phase = "holding";
      } else if (phase === "holding") {
        holdTicks += 1;
        if (holdTicks > 22) {
          phase = "erasing";
          holdTicks = 0;
        }
      } else {
        charIndex -= 1;
        setTyped(line.slice(0, charIndex));
        if (charIndex <= 0) {
          phase = "typing";
          lineIndex = (lineIndex + 1) % t.ui.lines.length;
        }
      }
    }, 58);
    return () => window.clearInterval(timer);
  }, [reducedMotion, t.ui.lines]);

  return (
    <Surface variant="page" as="section" id="memory" className={styles.section}>
      <Reveal className={styles.intro}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-h1 font-normal text-text-heading">{t.title}</h2>
        <p className="mt-6 max-w-[56ch] text-body text-text-muted">{t.body}</p>
      </Reveal>

      <Reveal delay={0.1} className={styles.hubWrap}>
        <div className={styles.hub} aria-hidden="true">
          <svg className={styles.hubSvg} viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
            {POSITIONS.map((pos, index) => (
              <line
                key={index}
                x1={pos.left}
                y1={pos.top}
                x2="50%"
                y2="50%"
                className={styles.hubLine}
                style={{ animationDelay: `${index * 0.3}s` }}
              />
            ))}
          </svg>
          {POSITIONS.map((pos, index) => (
            <span
              key={index}
              className={styles.hubPulse}
              style={{ left: pos.left, top: pos.top, animationDelay: `${index * 0.4}s` }}
              aria-hidden="true"
            />
          ))}

          <div className={styles.hubCenter}>
            <p className={styles.hubStatus}>{t.ui.status}</p>
            <p className={styles.hubTyped}>
              <span className={styles.hubLearning}>{t.ui.learning}</span> {typed}
              <span className={styles.hubCaret} aria-hidden="true" />
            </p>
          </div>
        </div>

        <div className={styles.ticks} aria-hidden="true">
          {t.ui.ticks.map((tick) => (
            <span key={tick} className={styles.tick}>
              {tick}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.1} className={styles.list}>
        <ul>
          {t.memories.map((memory) => (
            <li key={memory.title} className={`${styles.row} hairline-top`}>
              <span className={`text-label uppercase text-text-muted ${styles.category}`}>{memory.category}</span>
              <div className={styles.content}>
                {"editing" in memory && memory.editing ? (
                  <div className={styles.titleEditRow}>
                    <p className={styles.titleInput}>{memory.title}</p>
                    <span className={styles.editingBadge} aria-hidden="true">
                      {t.editingLabel}
                    </span>
                  </div>
                ) : (
                  <p className="text-body font-medium text-text-primary">{memory.title}</p>
                )}
                <p className="mt-2 text-body text-text-muted">{memory.description}</p>
                <p className={styles.provenance}>{memory.provenance}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </Surface>
  );
}
