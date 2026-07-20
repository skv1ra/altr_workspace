import { afterEach, describe, expect, it } from "vitest";
import {
  EASE_ALTR,
  fadeRise,
  getReducedMotionOverride,
  setReducedMotionOverride,
  staggerContainer,
  STAGGER_STEP_SECONDS,
  transitions,
} from "@/lib/motion";

describe("lib/motion config", () => {
  afterEach(() => {
    setReducedMotionOverride(null);
  });

  it("EASE_ALTR matches --ease-altr in tokens.css", () => {
    expect(EASE_ALTR).toEqual([0.22, 1, 0.36, 1]);
  });

  it("exports transition presets with the expected durations (snapshot)", () => {
    expect(transitions).toMatchInlineSnapshot(`
      {
        "drift": {
          "duration": 24,
          "ease": [
            0.22,
            1,
            0.36,
            1,
          ],
          "repeat": Infinity,
          "repeatType": "mirror",
        },
        "enter": {
          "duration": 0.6,
          "ease": [
            0.22,
            1,
            0.36,
            1,
          ],
        },
        "micro": {
          "duration": 0.18,
          "ease": [
            0.22,
            1,
            0.36,
            1,
          ],
        },
      }
    `);
  });

  it("fadeRise never moves more than the 16px visual ceiling", () => {
    expect(Math.abs(fadeRise.hidden.y)).toBeLessThanOrEqual(16);
    expect(fadeRise.visible.y).toBe(0);
  });

  it("staggerContainer uses the 60ms step", () => {
    expect(STAGGER_STEP_SECONDS).toBe(0.06);
    expect(staggerContainer.visible.transition.staggerChildren).toBe(0.06);
  });

  it("setReducedMotionOverride/getReducedMotionOverride round-trip", () => {
    expect(getReducedMotionOverride()).toBeNull();
    setReducedMotionOverride(true);
    expect(getReducedMotionOverride()).toBe(true);
    setReducedMotionOverride(false);
    expect(getReducedMotionOverride()).toBe(false);
  });
});
