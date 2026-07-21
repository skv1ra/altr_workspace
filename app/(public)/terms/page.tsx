import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const metadata = { title: "Terms" };

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className="pb-24 pt-32">
      <Header />
      <LegalDocumentPage kind="terms" />
      <Footer />
    </main>
  );
}
