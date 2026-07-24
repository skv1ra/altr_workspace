import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./StageRail.module.css";

export interface StageRailProps {
  /** 0 = parsing, 1 = saving, 2 = extracting, 3 = done. */
  currentIndex: number;
  /** The current stage stopped on a designed error/paused state, not progress. */
  error?: boolean;
  lang: Lang;
}

/**
 * Calm four-node progress rail — thin hairline connectors, Label-scale
 * stage names, no percentages (the worker/extract protocol has no
 * granular counts to report honestly; the numbers that DO exist — chunk
 * x/y, batch n — render in the status paragraph below this rail, not
 * here). "Reading file" and "Parsing" are deliberately one node: the
 * parser worker posts a single final result message with no intermediate
 * signal, so splitting them would fabricate a distinction that isn't real.
 */
export function StageRail({ currentIndex, error = false, lang }: StageRailProps) {
  const t = getSharedCopy(lang).imports;
  const stages = [t.stageParsing, t.stageSaving, t.stageExtracting, t.stageDone];

  return (
    <ol className={styles.rail} aria-hidden="true">
      {stages.map((stageLabel, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex;
        const state = isCurrent && error ? "error" : isCurrent ? "current" : isDone ? "done" : "pending";
        return (
          <li key={stageLabel} className={styles.node} data-state={state}>
            <span className={styles.dot} />
            <span className={styles.label}>{stageLabel}</span>
            {index < stages.length - 1 && <span className={styles.connector} data-state={isDone ? "done" : "pending"} />}
          </li>
        );
      })}
    </ol>
  );
}
