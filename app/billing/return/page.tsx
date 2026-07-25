import type { Metadata } from "next";
import { BillingReturnContent } from "@/components/app/billing/BillingReturnContent";

export const metadata: Metadata = { title: "Checkout complete" };

// Same CSP-nonce-vs-static-generation fix as `/import-conversations`
// (032) and every other client-state-only page since 020.
export const dynamic = "force-dynamic";

export default function BillingReturnPage() {
  return <BillingReturnContent />;
}
