import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

/**
 * Adapted from LEGACY's own `tests/phase10-legal-consistency.test.ts`
 * (pinned `a22927d`) for Prompt 046 — not ported verbatim, since it
 * asserted against files this rebuild replaced (`components/
 * CookieBanner.tsx`, `components/legal/PrivacySettingsPanel.tsx`, both
 * MVP-era and gone; the real, current equivalents are
 * `components/legal/CookieConsent.tsx` (045) and
 * `components/app/privacy/{ConsentsSection,ExportSection,
 * AccountDeletionDialog,DeletionRequestForm}.tsx`). Same assertions in
 * spirit, verified against the real current file set.
 */
describe("phase 10/11 legal and consent consistency", () => {
  it("documents the actual production providers and Merchant of Record", () => {
    const config = read("lib/legal/legal-config.ts");
    expect(config).toContain('HOSTING_PROVIDER_NAME: "Vercel"');
    expect(config).toContain('DATABASE_PROVIDER_NAME: "Supabase Database (Postgres)"');
    expect(config).toContain('AUTH_PROVIDER_NAME: "Supabase Auth"');
    expect(config).toContain("OpenAI");
    expect(config).toContain("Merchant of Record");
  });

  it("keeps owner-required legal values unresolved rather than inventing them", () => {
    const config = read("lib/legal/legal-config.ts");
    for (const key of ["LEGAL_ENTITY_NAME", "GOVERNING_LAW", "MINIMUM_AGE", "DATA_RETENTION_PERIOD"]) {
      expect(config).toMatch(new RegExp(`${key}: "\\[NEEDS OWNER INPUT:`));
    }
  });

  it("does not enable analytics or marketing anywhere in the real cookie-consent path", () => {
    const store = read("lib/legal/cookie-store.ts");
    const consent = read("components/legal/CookieConsent.tsx");
    expect(store).toContain("analytics: false");
    expect(store).toContain("marketing: false");
    expect(consent).not.toContain('analytics: true');
    expect(consent).not.toContain('marketing: true');
  });

  it("provides a production verification release gate", () => {
    const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(packageJson.scripts["verify:production"]).toBe("node scripts/verify-production.mjs");
    const verifier = read("scripts/verify-production.mjs");
    expect(verifier).toContain("Legal owner-required values remain unresolved");
    expect(verifier).toContain("LEMONSQUEEZY_PERSONAL_VARIANT_ID");
    expect(verifier).toContain("NEXT_PUBLIC_ENABLE_ANALYTICS");
  });

  it("uses only the real, server-backed consent/export/deletion endpoints — never a client-only or dead duplicate", () => {
    const consents = read("components/app/privacy/ConsentsSection.tsx");
    expect(consents).toContain("/api/consents/grant");
    expect(consents).toContain("/api/consents/withdraw");

    const exportSection = read("components/app/privacy/ExportSection.tsx");
    expect(exportSection).toContain("/api/privacy/export");

    const deletion = read("components/app/privacy/useAccountDeletion.ts");
    expect(deletion).toContain("/api/privacy/account");
    // RISKS.md R16 — the real ceremony must never call the dead, weaker
    // duplicate deletion path (a real fetch call, not just the file's own
    // comment explaining why it avoids that path).
    expect(deletion).not.toMatch(/fetch\(\s*["'`]\/api\/me["'`]/);

    const request = read("components/app/privacy/DeletionRequestForm.tsx");
    expect(request).toContain("/api/privacy/deletion-requests");
  });

  it("every real legal document is reachable from the footer and from the in-app privacy center", () => {
    const footer = read("components/site/Footer.tsx");
    for (const href of ['"/privacy"', '"/terms"', '"/cookies"']) expect(footer).toContain(href);

    const privacyCenter = read("components/app/privacy/PrivacyCenter.tsx");
    for (const href of ['"/terms"', '"/privacy"', '"/cookies"', '"/data-deletion"']) expect(privacyCenter).toContain(href);
  });
});
