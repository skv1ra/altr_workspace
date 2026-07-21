"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Surface } from "@/components/ui/Surface";
import { memoryDemoCopy } from "@/lib/i18n/home-copy";
import { useLang } from "@/lib/i18n/lang-store";
import styles from "./MemoryDemo.module.css";

/**
 * Memory demonstration (Prompt 021): a static, fictional but real-
 * shaped preview of the memory list — same fields the actual
 * `altr_memories` API returns (see `lib/i18n/home-copy.ts`'s own
 * comment on `memoryDemoCopy` for exactly how this mirrors, not
 * invents, that shape). Rendered as a calm, hairline-divided list on an
 * obsidian surface (`Surface variant="inverse"`) — not a card grid —
 * matching DESIGN_DIRECTION's own dashboard rule ("data displayed as
 * calm editorial lists/tables, not card grids") since this section's own
 * visual requirement is to preview what the future dashboard (Prompt
 * 038) will look like.
 *
 * The one memory marked `editing` in the copy data renders its title as
 * a bordered, input-shaped box with a small "Editing" label next to it —
 * deliberately not a real `<input>` or any focusable/interactive markup,
 * and the label is a plain `<span>`, not a button: this prompt's own
 * "no dead buttons — decorative controls are plainly decorative" rule.
 * It communicates editability by looking like an in-progress edit, not
 * by offering a control that does nothing when clicked.
 */
export function MemoryDemo() {
  const [lang] = useLang("EN");
  const t = memoryDemoCopy[lang];

  return (
    <Surface variant="inverse" as="section" id="memory" className={styles.section}>
      <Reveal className={styles.intro}>
        <p className="text-label uppercase text-text-muted">{t.eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-h1 font-normal text-text-primary">{t.title}</h2>
        <p className="mt-6 max-w-[56ch] text-body text-text-muted">{t.body}</p>
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
