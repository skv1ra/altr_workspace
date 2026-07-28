import { describe, expect, it } from "vitest";
import { renderHomepageBundle } from "@/lib/homepage-bundle";

describe("renderHomepageBundle", () => {
  it("routes homepage account links to the real auth page", () => {
    const html = renderHomepageBundle("test-nonce");

    expect(html).not.toContain('href=\\"#auth\\"');
    expect(html.match(/href=\\"\/auth\?mode=login\\"/g)).toHaveLength(2);
    expect(html.match(/href=\\"\/auth\?mode=register\\"/g)).toHaveLength(3);
  });
});
