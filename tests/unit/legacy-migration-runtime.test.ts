import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("legacy migration runtime", () => {
  it("renders per request so production CSP can nonce its hydration scripts", () => {
    const source = readFileSync("app/legacy-migration/page.tsx", "utf8");

    expect(source).toContain('export const dynamic = "force-dynamic"');
  });
});
