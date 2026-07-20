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

// Hex values below must match app/styles/tokens.css.
const ALTR_WHITE = "#f5f6f7"; // --altr-white / --surface-page
const ALTR_GRAPHITE = "#3a3f45"; // --altr-graphite / --text-primary (light surfaces)
const ALTR_OBSIDIAN = "#15171a"; // --altr-obsidian / --surface-inverse
const ALTR_MIST = "#b9c0c7"; // --altr-mist / --text-muted override on .surface-inverse

// Effective rendered color of --text-muted (rgb(var(--altr-graphite-rgb) / 78%))
// composited over --surface-page, as a browser would paint it — see the
// comment above --text-muted in tokens.css.
const TEXT_MUTED_ON_PAGE = "#63676c";

describe("token contrast pairs (WCAG AA, body text)", () => {
  it("primary text on the page surface: graphite on white", () => {
    expect(contrastRatio(ALTR_GRAPHITE, ALTR_WHITE)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("primary text on the inverse surface: white on obsidian", () => {
    expect(contrastRatio(ALTR_WHITE, ALTR_OBSIDIAN)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("muted text on the inverse surface: mist on obsidian", () => {
    expect(contrastRatio(ALTR_MIST, ALTR_OBSIDIAN)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("muted text on the page surface is compliant, unlike raw mist-on-white", () => {
    // --altr-mist itself on white is ~1.7:1 — far below AA — which is exactly
    // why --text-muted does not resolve to plain --altr-mist on light surfaces.
    expect(contrastRatio(ALTR_MIST, ALTR_WHITE)).toBeLessThan(WCAG_AA_BODY_TEXT);
    expect(contrastRatio(TEXT_MUTED_ON_PAGE, ALTR_WHITE)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });
});
