import { notFound } from "next/navigation";
import Link from "next/link";
import { HeroScene } from "@/components/hero/HeroScene";
import { ReferenceOverlay } from "@/components/hero/ReferenceOverlay";

export const metadata = { title: "Hero lab" };

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

/**
 * Prompt 014's final hero composition, viewed in isolation. Dev-only, 404s
 * in production (same pattern as /styleguide) — nav here is for reviewing
 * composition against the reference at realistic width, not the production
 * Header (Prompt 019 owns that), and this page isn't wired into the real
 * homepage yet (Prompt 020 does that integration).
 *
 * Reference-overlay calibration aid (press R) still applies: bottom-right
 * toggle badge, never covers the hero itself.
 */
export default function HeroLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main>
      <section className="relative w-full overflow-hidden">
        <HeroScene />

        <ReferenceOverlay />

        <nav
          aria-label="Primary"
          className="absolute inset-x-0 top-0 z-30 mx-auto flex max-w-[1440px] items-center justify-between px-10 py-6"
        >
          <span className="text-body font-medium text-text-primary">Altr</span>
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-label uppercase text-text-muted transition-colors hover:text-text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/auth?mode=login"
                className="text-label uppercase text-text-muted transition-colors hover:text-text-primary"
              >
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      </section>
    </main>
  );
}
