import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { DeletionCenter } from "@/components/app/privacy/DeletionCenter";

export const metadata: Metadata = { title: "Delete your data" };

/**
 * Same CSP-nonce-vs-static-generation fix as `/privacy`/`/terms`/
 * `/cookies` (020/024) — `Header`/`Footer`/`DeletionCenter` all read
 * auth/language client state, so this needs a fresh nonce per request.
 *
 * `lib/legal/deletion-content.ts` (must-not-change) explicitly describes
 * this exact route hosting both the signed-in ceremony and the external
 * request form "on the same page" — honored here via the shared
 * `DeletionCenter`, not LEGACY's own broken, local-storage-only
 * prototype (see STATUS.md for the full finding).
 */
export const dynamic = "force-dynamic";

export default function DeleteDataPage() {
  return (
    <main className="pb-24 pt-32">
      <Header />
      <DeletionCenter />
      <Footer />
    </main>
  );
}
