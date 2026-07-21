import { Header } from "@/components/site/Header";
import { HeroScene } from "@/components/hero/HeroScene";
import { ProductSection } from "@/components/site/ProductSection";
import { HowItWorks } from "@/components/site/HowItWorks";
import { MemoryDemo } from "@/components/site/MemoryDemo";
import { TwinDemo } from "@/components/site/TwinDemo";
import { PrivacySection } from "@/components/site/PrivacySection";
import "./page.css";

export const dynamic = "force-dynamic";

/**
 * Real landing page (Prompt 020) — replaces the Prompt 004 single-line
 * placeholder. First two viewports only: `Header` + `HeroScene` (the
 * approved `/hero-lab` composition, unchanged — same component, no fork)
 * plus `#product`. Everything the LEGACY landing communicated beyond that
 * (how-it-works demo, memory section, privacy section, pricing, final CTA,
 * footer) is intentionally not here yet — see STATUS.md's own ledger for
 * exactly what's deferred to which later prompt (021-024) rather than
 * silently dropped.
 *
 * No wrapping `<section>` around `HeroScene` here (unlike `/hero-lab`,
 * which wraps it for its own dev-only nav/reference-overlay needs) —
 * `HeroScene`'s own root already sets `position: relative; overflow:
 * hidden; width: 100%` and establishes its own container-query context
 * for the mobile/reduced-data tiers (Prompt 017), so nothing extra is
 * needed for it to work standalone in normal page flow. `Header` is
 * `position: fixed` and overlays it correctly with no special wrapping
 * either.
 *
 * Prompt 021 appends `#how-it-works` and the memory demonstration
 * (`#memory`). Prompt 022 appends the Twin demonstration (`#twin`) and
 * the privacy section (`#privacy`) — see STATUS.md's own ledger for
 * what's still deferred to 023-024 (pricing, final CTA, footer).
 */
export default function HomePage() {
  return (
    <main>
      <Header />
      <HeroScene />
      <ProductSection />
      <HowItWorks />
      <MemoryDemo />
      <TwinDemo />
      <PrivacySection />
    </main>
  );
}
