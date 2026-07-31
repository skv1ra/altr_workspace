import { describe, expect, it } from "vitest";
import { renderHomepageBundle } from "@/lib/homepage-bundle";

describe("renderHomepageBundle", () => {
  it("routes homepage account links to the real auth page", () => {
    const html = renderHomepageBundle("test-nonce");

    expect(html).not.toContain('href=\\"#auth\\"');
    expect(html.match(/href=\\"\/auth\?mode=login\\"/g)).toHaveLength(2);
    expect(html.match(/href=\\"\/auth\?mode=register\\"/g)).toHaveLength(3);
  });

  it("routes every exported navigation link to a section or real page that exists", () => {
    const html = renderHomepageBundle("test-nonce");

    expect(html).not.toContain('href=\\"#pricing\\"');
    expect(html).not.toContain('href=\\"#privacy-policy\\"');
    expect(html).not.toContain('href=\\"#terms\\"');
    expect(html).not.toContain('href=\\"#cookies\\"');
    expect(html.match(/href=\\"\/pricing\\"/g)).toHaveLength(2);
    expect(html).toContain('href=\\"\/privacy\\"');
    expect(html).toContain('href=\\"\/terms\\"');
    expect(html).toContain('href=\\"\/cookies\\"');
  });
});
