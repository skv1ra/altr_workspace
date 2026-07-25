import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { DeletionPolicyContent } from "@/components/app/privacy/DeletionPolicyContent";

export const metadata: Metadata = { title: "Data deletion" };

export const dynamic = "force-dynamic";

export default function DataDeletionPage() {
  return (
    <main className="pb-24 pt-32">
      <Header />
      <DeletionPolicyContent />
      <Footer />
    </main>
  );
}
