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

// Hex values below must match app/styles/tokens.css (black-velvet theme).
const VOID_BLACK = "#000000"; // --surface-page / --color-void-black
const SURFACE_LIFT = "#0b0e14"; // --surface-inverse / --surface-lift
const WHITE = "#ffffff"; // --text-heading
const BONE_WHITE = "#f0f0f0"; // --text-primary / --altr-white / --altr-graphite
const ASH_GRAY = "#a1a4a5"; // --text-muted / --altr-mist
const IRIS_VIOLET = "#9281f7"; // --accent-code
const ALARM_RED = "#ff9592"; // --color-alarm-red (error text)
const GRAPHITE_HAIRLINE = "#292d30"; // --edge-hairline — border, never text

describe("token contrast pairs (WCAG AA, body text)", () => {
  it("heading text on the void canvas: white on black", () => {
    expect(contrastRatio(WHITE, VOID_BLACK)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("primary text on the void canvas: bone white on black", () => {
    expect(contrastRatio(BONE_WHITE, VOID_BLACK)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("primary and muted text on the lifted panel surface", () => {
    expect(contrastRatio(BONE_WHITE, SURFACE_LIFT)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    expect(contrastRatio(ASH_GRAY, SURFACE_LIFT)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("muted text on the void canvas: ash gray on black", () => {
    expect(contrastRatio(ASH_GRAY, VOID_BLACK)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("accent and status text on the void canvas clear AA", () => {
    expect(contrastRatio(IRIS_VIOLET, VOID_BLACK)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    expect(contrastRatio(ALARM_RED, VOID_BLACK)).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
  });

  it("the hairline is a border color, not a text color", () => {
    // #292d30 on black is ~1.6:1 — far below AA — which is exactly why
    // --edge-hairline may only ever draw 1px borders, never label text.
    expect(contrastRatio(GRAPHITE_HAIRLINE, VOID_BLACK)).toBeLessThan(WCAG_AA_BODY_TEXT);
  });
});
