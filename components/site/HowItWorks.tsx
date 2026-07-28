"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { howItWorksCopy, memoryDemoCopy, twinDemoCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import { useReducedMotionSafe } from "@/lib/motion";
import styles from "./HowItWorks.module.css";

const FILES = ["whatsapp_export_2026.txt", "telegram_chat_history.json", "instagram_messages.json", "messenger_inbox.html"];

/**
 * `#how-it-works` (light-theme redesign, ported from the Claude Design
 * export): the three steps still read top-to-bottom on the left, but now
 * drive a sticky demo panel on the right that crossfades between the three
 * things this section actually claims — a file list being parsed, the
 * resulting memory list with on/off switches, and a draft the user approves
 * or discards. All three panels use real state from this component; nothing
 * here calls an API, it's illustrative like `MemoryDemo`/`TwinDemo` already are.
 */
export function HowItWorks() {
  const [lang] = useLang("EN");
  const t = howItWorksCopy[lang];
  const memories = memoryDemoCopy[lang].memories.slice(0, 3);
  const reducedMotion = useReducedMotionSafe();

  const [activeStep, setActiveStep] = useState(0);
  const [fileParsed, setFileParsed] = useState([true, true, true, false]);
  const [memOn, setMemOn] = useState([true, true, false]);
  const [verdict, setVerdict] = useState<null | "approved" | "discarded">(null);

  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (reducedMotion) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = stepRefs.current.findIndex((node) => node === entry.target);
          if (index !== -1) setActiveStep(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    stepRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <Surface variant="page" as="section" id="how-it-works" className={styles.section}>
      <Reveal className={styles.intro}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-h1 font-normal text-text-heading">{t.title}</h2>
      </Reveal>

      <div className={styles.layout}>
        <div className={styles.steps}>
          {t.steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.06}>
              <div
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
                className={`${styles.step} hairline-top ${index === activeStep ? styles.stepActive : ""}`}
                onClick={() => stepRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
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

        <div className={styles.stageCol}>
          <div className={styles.stage}>
            <div className={styles.stageHeader}>
              <span className={styles.stageLabel}>{t.steps[activeStep].title}</span>
              <span className={styles.stageIndex}>
                {t.steps[activeStep].number} / 0{t.steps.length}
              </span>
            </div>

            <div className={styles.stageBody}>
              <div className={`${styles.panel} ${activeStep === 0 ? styles.panelActive : ""}`}>
                <p className={styles.panelLabel}>{t.panel.sources}</p>
                <div className={styles.fileList}>
                  {FILES.map((file, index) => (
                    <button
                      key={file}
                      type="button"
                      className={styles.fileRow}
                      aria-pressed={fileParsed[index]}
                      onClick={() =>
                        setFileParsed((prev) => prev.map((value, i) => (i === index ? !value : value)))
                      }
                    >
                      <span className={styles.fileCheckbox} data-checked={fileParsed[index]} aria-hidden="true">
                        <span />
                      </span>
                      <span className={styles.fileName}>{file}</span>
                      <span className={styles.fileState}>{fileParsed[index] ? t.panel.parsed : t.panel.skipped}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${styles.panel} ${activeStep === 1 ? styles.panelActive : ""}`}>
                <p className={styles.panelLabel}>{t.panel.memoryList}</p>
                <div className={styles.memList}>
                  {memories.map((memory, index) => (
                    <button
                      key={memory.title}
                      type="button"
                      role="switch"
                      aria-checked={memOn[index]}
                      aria-label={memory.title}
                      className={styles.memRow}
                      onClick={() => setMemOn((prev) => prev.map((value, i) => (i === index ? !value : value)))}
                    >
                      <span className={styles.memText}>
                        <span className={styles.memCategory}>{memory.category}</span>
                        <span className={styles.memTitle}>{memory.title}</span>
                      </span>
                      <span className={styles.switchTrack} data-checked={memOn[index]} aria-hidden="true">
                        <span className={styles.switchKnob} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${styles.panel} ${activeStep === 2 ? styles.panelActive : ""}`}>
                <div>
                  <p className={styles.panelLabel}>{t.panel.incoming}</p>
                  <p className={styles.incomingBubble}>{twinDemoCopy[lang].incomingMessage}</p>
                </div>
                <div className={styles.draftWrap}>
                  <p className={styles.panelLabelDark}>{t.panel.draft}</p>
                  <p className={styles.draftBubble}>{twinDemoCopy[lang].draftMessage}</p>
                </div>
                <div className={styles.verdictRow}>
                  <button
                    type="button"
                    className={styles.approveBtn}
                    onClick={() => setVerdict((v) => (v === "approved" ? null : "approved"))}
                  >
                    {verdict === "approved" ? t.panel.reviewed : t.panel.review}
                  </button>
                  <button
                    type="button"
                    className={styles.discardBtn}
                    onClick={() => setVerdict((v) => (v === "discarded" ? null : "discarded"))}
                  >
                    {verdict === "discarded" ? t.panel.discarded : t.panel.discard}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}
