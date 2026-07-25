import type { Metadata } from "next";
import { ReceiptDetail } from "@/components/app/billing/ReceiptDetail";

export const metadata: Metadata = { title: "Receipt" };

// Same CSP-nonce-vs-static-generation fix as `/import-conversations`
// (032) — this page's own data comes entirely from a client-side fetch
// (see `ReceiptDetail`'s own comment for why no server route backs it),
// so without this it would be eligible for static generation.
export const dynamic = "force-dynamic";

export default function ReceiptPage({ params }: { params: { orderId: string } }) {
  return <ReceiptDetail orderId={params.orderId} />;
}
