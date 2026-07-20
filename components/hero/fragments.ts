export interface HeroFragmentWaveform {
  /** Relative bar heights (px) — purely decorative. */
  bars: number[];
  /** The real text alternative for the waveform (this prompt's own
   * accessibility requirement: "waveform SVG aria-hidden with text
   * alternative in the memo label"). */
  duration: string;
}

export interface HeroFragment {
  id: string;
  /** Must match a `SHARDS` id in HeroLayers.tsx — the shard this fragment
   * is anchored inside, so it moves with that shard's glass (including any
   * future parallax/drift Prompt 016 adds). */
  shardId: string;
  /** Small-caps supporting label, e.g. "VOICE MEMO". Omitted for the
   * quietest fragments (a bare date, a phrase). */
  kicker?: string;
  /** The fragment's single unique primary line — what the required RTL
   * test and the accessible list key off. */
  title: string;
  /** 1-2 supporting lines (message excerpt, phrase continuation, place/date
   * detail). Line-clamped to 2 in CSS regardless of length. */
  detail?: string[];
  waveform?: HeroFragmentWaveform;
  italic?: boolean;
  /** Local placement as a percentage of the anchor shard's own rendered
   * box (not the viewport) — tuned per shard, by real screenshot, to sit
   * inside that shard's dark glass facet rather than spill onto its edges. */
  x: number;
  y: number;
  width: number;
}

/**
 * Fictional content only, per this prompt's security/privacy requirement —
 * no real names, phone numbers, or a real person's memories. Dates, the
 * place name, and every phrase below are invented for this design exercise.
 * Kept deliberately restrained (DESIGN_DIRECTION's copy voice: calm,
 * precise, never saccharine) — five fragments, one per content archetype
 * DESIGN_DIRECTION names (voice memo, message excerpt, memory title,
 * emotional phrase, date), except location, which is folded into the
 * memory-title fragment's detail line rather than given its own anchor —
 * the only shard left over for a sixth fragment (`mid-right-support`,
 * ~86px wide at 1440px) measured too small to hold even a short label
 * legibly.
 *
 * Anchored to exactly the two `blur: 0` back-tier shards (`main`,
 * `small-central`) plus three softer ones — by construction, never more
 * than 2 fragments render fully sharp at once, satisfying this prompt's
 * "max 2 simultaneously sharp" rule without needing a runtime check.
 */
export const HERO_FRAGMENTS: HeroFragment[] = [
  {
    id: "voice-memo",
    shardId: "main",
    kicker: "VOICE MEMO",
    title: "March 14, 2019",
    detail: ["I don't want to explain it —", "I just want you to remember it too."],
    waveform: { bars: [3, 6, 4, 9, 5, 11, 6, 8, 4, 7, 10, 5, 3, 6, 8], duration: "0:42" },
    x: 34,
    y: 38,
    width: 48,
  },
  {
    // x/width shifted right (18/64 -> 30/52): the first pass had "October"
    // and "MESSAGE" spilling past this shard's own left edge onto the
    // transparent margin around its irregular silhouette — moved in after
    // checking a real screenshot of this shard alone (see STATUS.md).
    id: "message",
    shardId: "lower-mid-support",
    kicker: "MESSAGE",
    title: "October 3, 2020",
    detail: ["Send the photos when you can.", "I want to see it, too."],
    x: 30,
    y: 20,
    width: 55,
  },
  {
    id: "memory-title",
    shardId: "upper-center-blurred",
    kicker: "MEMORY",
    title: "The apartment on Vysoka St.",
    detail: ["Lviv, 2014–2019"],
    x: 22,
    y: 28,
    width: 58,
  },
  {
    // y moved well down (34 -> 62): this shard is a triangle narrow at the
    // top and widening toward the bottom — at y:34 the fragment box mostly
    // fell outside its silhouette (into transparent margin, against
    // near-white fog, so the text was there but essentially invisible).
    // Checked against a real screenshot of this shard alone.
    id: "phrase",
    shardId: "upper-left-background",
    title: "“you always called first”",
    italic: true,
    x: 14,
    y: 62,
    width: 66,
  },
  {
    // x shifted right (8 -> 24): same off-the-glass spill as "message",
    // checked against a real screenshot of this shard alone.
    id: "date",
    shardId: "small-central",
    title: "August 9, 2016",
    x: 24,
    y: 36,
    width: 62,
  },
];

export function heroFragmentsFor(shardId: string): HeroFragment[] {
  return HERO_FRAGMENTS.filter((fragment) => fragment.shardId === shardId);
}
