import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const metadata = { title: "Privacy" };

/**
 * Same CSP-nonce-vs-static-generation fix as `/` and `/pricing` (020/023) —
 * this page also renders `Header`/`Footer`'s auth- and language-aware
 * client state, so it needs a fresh nonce per request too.
 */
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <main className="pb-24 pt-32">
      <Header />
      <LegalDocumentPage kind="privacy" />
      <Footer />
    </main>
  );
}
