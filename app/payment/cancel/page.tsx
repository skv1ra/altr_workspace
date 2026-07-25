import type { Metadata } from "next";
import { PaymentCancelContent } from "@/components/app/billing/PaymentCancelContent";

export const metadata: Metadata = { title: "Checkout cancelled" };

// Same CSP-nonce-vs-static-generation fix as `/import-conversations`
// (032) and every other client-state-only page since 020 — this page
// has no data of its own at all, so without this it would be eligible
// for static generation and could serve a stale CSP nonce.
export const dynamic = "force-dynamic";

export default function PaymentCancelPage() {
  return <PaymentCancelContent />;
}
