// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

function collectFiles(dir: string, extensions: string[], acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) collectFiles(full, extensions, acc);
    else if (extensions.some((ext) => entry.name.endsWith(ext))) acc.push(full);
  }
  return acc;
}

const read = (path: string) => readFileSync(path, "utf8");

/**
 * Prompt 046's own accessibility/legal audit — durable, cheap, source-
 * level regression guards for findings verified during that audit
 * (`A11Y_AUDIT.md` has the full per-screen findings log; these are the
 * ones worth pinning permanently rather than trusting a one-time manual
 * pass).
 */
describe("a11y regression guards (046)", () => {
  it("no component reintroduces LEGACY's raw low-contrast opacity text classes (text-white/N, text-black/N) instead of the vetted --text-muted/--text-primary tokens", () => {
    const files = [...collectFiles("components", [".tsx"]), ...collectFiles("app", [".tsx"])];
    const offenders = files.filter((file) => /text-(white|black)\/\d/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it("app/styles/controls.css keeps a forced-colors fallback for custom role=switch controls (Windows High Contrast, found during the 046 audit)", () => {
    const css = read("app/styles/controls.css");
    expect(css).toContain("forced-colors: active");
    expect(css).toContain('[role="switch"]');
  });

  it("every custom role=switch control in the codebase has a real, non-empty aria-label", () => {
    const files = [...collectFiles("components", [".tsx"])];
    for (const file of files) {
      const source = read(file);
      if (!source.includes('role="switch"')) continue;
      expect(source, `${file} has a role="switch" control without aria-label`).toMatch(/role="switch"[^>]*aria-label=\{?["'a-zA-Z]/);
    }
  });

  it("every real <img>/<Image> tag has an alt attribute (comments mentioning <img> in prose don't count)", () => {
    const files = [...collectFiles("components", [".tsx"]), ...collectFiles("app", [".tsx"])];
    // Strip block and line comments so backtick-quoted `<img>` mentions in
    // doc comments (real in this codebase, e.g. HeroLayers.tsx) never
    // register as a real JSX tag.
    const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const file of files) {
      const source = stripComments(read(file));
      const imgTags = source.match(/<(img|Image)\b[\s\S]*?\/?>/g) ?? [];
      for (const tag of imgTags) {
        expect(tag, `${file} has a real <img>/<Image> tag without alt=`).toMatch(/\balt=/);
      }
    }
  });
});
