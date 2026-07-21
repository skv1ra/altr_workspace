import { Header } from "@/components/site/Header";
import { PricingTable } from "@/components/site/PricingTable";

export const metadata = { title: "Pricing" };

/*
 * Forces per-request rendering, same as `app/(public)/page.tsx` (Prompt
 * 020) — a statically prerendered page's HTML is frozen at build time,
 * but `middleware.ts` mints a fresh CSP nonce per request; the two can
 * never match, which silently breaks every client-side interaction on a
 * static page in production (confirmed directly in 020: zero working
 * nonces on `/`'s inline hydration scripts until this was added). This
 * page needs real interactivity (checkout, auth-aware CTAs) just like the
 * homepage, so it needs the same fix, applied proactively this time
 * rather than rediscovering the bug.
 */
export const dynamic = "force-dynamic";

/**
 * Pricing page (Prompt 023). `PricingTable` owns all of the page's own
 * visible content, including its eyebrow/title/subtitle — see that
 * component's own doc comment for why (a first pass split the intro
 * across a server-rendered page.tsx and the client-rendered table,
 * which broke language switching for just the heading).
 */
export default function PricingPage() {
  return (
    <main className="pb-24 pt-32">
      <Header />
      <PricingTable />
    </main>
  );
}
