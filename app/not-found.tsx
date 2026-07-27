import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-prose flex-col items-center justify-center gap-6 px-6 py-32 text-center">
        <p className="text-label uppercase text-text-muted">404</p>
        <h1 className="text-h2 text-text-primary">This page doesn&rsquo;t exist.</h1>
        <p className="text-body text-text-muted">
          The link may be old, or the page may have moved. Let&rsquo;s get you back.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-altr-obsidian px-6 py-3 text-body font-medium text-altr-white transition-colors duration-fast ease-altr hover:bg-altr-black"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
