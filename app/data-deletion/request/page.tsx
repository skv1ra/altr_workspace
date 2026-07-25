import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { DeletionCenter } from "@/components/app/privacy/DeletionCenter";

export const metadata: Metadata = { title: "Data deletion request" };

export const dynamic = "force-dynamic";

/**
 * Real, current `/data-deletion/request` — LEGACY's own already-correct
 * implementation of this exact flow, restyled with the same shared
 * `DeletionCenter` `/delete-data` now also uses (see that page's own
 * comment). Kept as a separate route from `/delete-data` even though
 * both render identical content: `lib/legal/privacy-content.ts`/
 * `terms-content.ts` (must-not-change) reference both paths by name in
 * their own prose, and this one is also linked directly from
 * `/data-deletion`'s policy page.
 */
export default function DeletionRequestPage() {
  return (
    <main className="pb-24 pt-32">
      <Header />
      <DeletionCenter />
      <Footer />
    </main>
  );
}
