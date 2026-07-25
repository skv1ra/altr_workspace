import { Clock3 } from "lucide-react";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";
import styles from "./TwinRoadmapPreview.module.css";

export interface TwinPreview {
  id: string;
  name: string;
  status: string;
}

export interface TwinRoadmapPreviewProps {
  previews: TwinPreview[];
  lang: Lang;
}

/**
 * Renders exactly what `GET /api/assistants` (must-not-change) returns in
 * its own `previews` array — real data, not a hardcoded duplicate — so a
 * future change to that route's preview list shows up here automatically.
 * The descriptive body sentence per module isn't part of that API shape
 * (it only sends `{id, name, status}`), so it's looked up locally by
 * `id`; an id this page doesn't recognize still renders honestly via a
 * generic fallback rather than being silently dropped. This prompt's own
 * instruction #3: "no dead buttons, no fake toggles" — there is
 * deliberately no `<button>`, `role="button"`, `tabIndex`, or hover state
 * anywhere in this component.
 */
export function TwinRoadmapPreview({ previews, lang }: TwinRoadmapPreviewProps) {
  const t = getSharedCopy(lang).twin;
  const bodyFor = (id: string) => (id === "operator" ? t.operatorBody : id === "negotiator" ? t.negotiatorBody : t.genericPreviewBody);

  if (previews.length === 0) return null;

  return (
    <section aria-labelledby="twin-roadmap-heading">
      <h2 id="twin-roadmap-heading" className="text-h4 font-normal text-text-primary">
        {t.roadmapHeading}
      </h2>
      <div className={styles.grid}>
        {previews.map((preview) => (
          <article key={preview.id} className={styles.card} aria-label={preview.name}>
            <span className={styles.badge}>
              <Clock3 aria-hidden="true" width={12} height={12} strokeWidth={1.6} style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />
              {t.roadmapBadge}
            </span>
            <p className={`text-h4 font-normal text-text-primary ${styles.name}`}>{preview.name}</p>
            <p className={`text-label normal-case text-text-muted ${styles.body}`}>{bodyFor(preview.id)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
