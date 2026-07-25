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
 * Prompt 044's own step 4: a security-regression-style, source-level
 * assertion that no component under `components/` or `app/(app)`/billing
 * pages sets plan/entitlement state from a URL param or localStorage.
 * Every real billing/payment surface (enumerated by hand, from having
 * read each one directly this session and in 042/043) is checked first,
 * then a broader sweep confirms nothing *else* under `components/` or
 * `app/(app)/` combines either mechanism with a plan/entitlement
 * identifier — not a guess, both branches were run against the real tree
 * before writing this comment, and the only three files anywhere that
 * use `localStorage`/`searchParams` at all (`MemoryOverview.tsx`'s own
 * search-state `URLSearchParams`, `AuthForm.tsx`'s `next`/`mode` params,
 * `ProductSection.tsx`'s `useLang` language preference) are all
 * unrelated to plan/premium/entitlement.
 */
describe("no client-side entitlement trust (real billing/payment surfaces)", () => {
  const billingFiles = [
    "components/app/billing/BillingOverview.tsx",
    "components/app/billing/InvoiceHistoryTable.tsx",
    "components/app/billing/PaymentConfirmation.tsx",
    "components/app/billing/PaymentNotice.tsx",
    "components/app/billing/PaymentCancelContent.tsx",
    "components/app/billing/BillingReturnContent.tsx",
    "components/app/billing/ReceiptDetail.tsx",
    "components/site/PricingTable.tsx",
    "components/app/PlanBadge.tsx",
    "app/(app)/billing/page.tsx",
    "app/payment/success/page.tsx",
    "app/payment/cancel/page.tsx",
    "app/payment/receipt/[orderId]/page.tsx",
    "app/billing/return/page.tsx",
  ];

  it("none of the real billing/payment surfaces reference useSearchParams/URLSearchParams/localStorage at all — every one derives plan/entitlement state only from a real server response", () => {
    for (const file of billingFiles) {
      const source = read(file);
      expect(source, `${file} must not use useSearchParams`).not.toContain("useSearchParams");
      expect(source, `${file} must not read searchParams.get`).not.toMatch(/searchParams\.get\(/);
      expect(source, `${file} must not construct URLSearchParams`).not.toContain("URLSearchParams");
      expect(source, `${file} must not read localStorage`).not.toContain("localStorage");
    }
  });
});

describe("no client-side entitlement trust (broader sweep — components/ and app/(app)/)", () => {
  const files = [
    ...collectFiles("components", [".tsx", ".ts"]),
    ...collectFiles("app/(app)", [".tsx", ".ts"]),
  ];
  const usesStorageOrParams = (source: string) => /useSearchParams|searchParams\.get\(|URLSearchParams|localStorage/.test(source);
  const suspiciousIdentifier = /\b(plan|premium|entitlement|effectivePlan|hasPremium)\b/i;

  it("found the expected, already-verified set of files using localStorage/searchParams at all (regression guard: a new one appearing here must be manually reviewed, not silently pass)", () => {
    const matches = files.filter((file) => usesStorageOrParams(read(file))).sort();
    expect(matches).toEqual(
      [
        "components/app/memory/MemoryOverview.tsx",
        "components/auth/AuthForm.tsx",
        "components/site/ProductSection.tsx",
      ].sort(),
    );
  });

  it("every file that does read a URL param or localStorage never combines it with a plan/premium/entitlement identifier", () => {
    for (const file of files) {
      const source = read(file);
      if (!usesStorageOrParams(source)) continue;
      expect(suspiciousIdentifier.test(source), `${file} combines localStorage/searchParams with a plan/entitlement identifier`).toBe(false);
    }
  });
});
