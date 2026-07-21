import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const metadata = { title: "Cookies" };

export const dynamic = "force-dynamic";

export default function CookiesPage() {
  return (
    <main className="pb-24 pt-32">
      <Header />
      <LegalDocumentPage kind="cookies" />
      <Footer />
    </main>
  );
}
