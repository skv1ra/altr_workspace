import styles from "./MemoryFragment.module.css";

/**
 * Low-contrast etched artifact rendered inside the main shard's face —
 * accessible HTML overlay, not baked into the image, per DESIGN_DIRECTION's
 * memory-fragment spec (date + voice-memo label + excerpt + waveform).
 * Content mirrors the reference image's own example for direct comparison
 * during this prototype phase; Prompt 015 owns the production version.
 */
const WAVEFORM_HEIGHTS = [3, 6, 4, 9, 5, 11, 6, 8, 4, 7, 10, 5, 3, 6, 8];

export function MemoryFragment({ className }: { className?: string }) {
  return (
    <div className={`${styles.fragment} ${className ?? ""}`} aria-hidden="true">
      <p className={styles.date}>MAY 17, 2018</p>
      <p className={styles.label}>VOICE MEMO</p>
      <p className={styles.excerpt}>
        I don&rsquo;t want to
        <br />
        for anything.
      </p>
      <div className={styles.waveformRow}>
        <div className={styles.waveform}>
          {WAVEFORM_HEIGHTS.map((height, index) => (
            <span key={index} style={{ height: `${height}px` }} />
          ))}
        </div>
        <span className={styles.timestamp}>0:23</span>
      </div>
    </div>
  );
}
