import { describe, expect, it } from "vitest";

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = channels.map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA_BODY_TEXT = 4.5;

// Hex values below must match app/styles/tokens.css (silver-fog theme).
const PAPER = "#f4f6f7"; // --color-paper / --surface-page / --altr-white
const OBSIDIAN = "#15171a"; // --text-heading / --surface-inverse / --altr-obsidian
const GRAPHITE = "#3a3f45"; // --text-primary / --altr-graphite
const MIST = "#b9c0c7"; // --altr-mist / --text-muted override on .surface-inverse
const SILVER = "#d9dde1"; // --edge-hairline — a border colour, never text
const IRIS_VIOLET = "#5b4bc4"; // --accent-code on the light canvas
const ALARM_RED = "#b3261e"; // --color-alarm-red (error text on the light canvas)

// Effective rendered colour of --text-muted (rgb(var(--altr-graphite-rgb) / 78%))
// composited over --surface-page, as a browser would paint it — see the
// comment above --text-muted in tokens.css.
const TEXT_MUTED_ON_PAGE = "#63676c";

describe("token contrast pairs (WCAG AA, body text)", () => {
  it("heading and body text on the page surface", () => {
    expect(contrastRatio(OBSIDIAN, PAPER)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    expect(contrastRatio(GRAPHITE, PAPER)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("primary and muted text on the inverse surface", () => {
    expect(contrastRatio(PAPER, OBSIDIAN)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    expect(contrastRatio(MIST, OBSIDIAN)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("muted text on the page surface is compliant, unlike raw mist-on-paper", () => {
    // --altr-mist itself on paper is ~1.7:1 — far below AA — which is exactly
    // why --text-muted does not resolve to plain --altr-mist on light surfaces.
    expect(contrastRatio(MIST, PAPER)).toBeLessThan(WCAG_AA_BODY_TEXT);
    expect(contrastRatio(TEXT_MUTED_ON_PAGE, PAPER)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("accent and status text on the page surface clear AA", () => {
    expect(contrastRatio(IRIS_VIOLET, PAPER)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    expect(contrastRatio(ALARM_RED, PAPER)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("the hairline is a border colour, not a text colour", () => {
    // Silver on paper is ~1.3:1 — far below AA — which is why --edge-hairline
    // may only ever draw 1px borders, never label text.
    expect(contrastRatio(SILVER, PAPER)).toBeLessThan(WCAG_AA_BODY_TEXT);
  });
});
