import { notFound } from "next/navigation";
import { HeroPrototype } from "@/components/hero/HeroPrototype";
import { Body, Heading, Label } from "@/components/ui/Text";

export const metadata = { title: "Hero lab" };

/**
 * ADR-007 hybrid-hero technical prototype. Dev-only — 404s in production,
 * same pattern as /styleguide. Kept around after this prompt: Phase 3
 * iterates on it directly rather than rebuilding from scratch.
 */
export default function HeroLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="section-stack mx-auto max-w-4xl space-y-8 px-6">
      <div className="space-y-2">
        <Label as="p">Internal / dev only — ADR-007 prototype</Label>
        <Heading level={1}>Hero technical prototype</Heading>
        <Body muted>
          Compare this against{" "}
          <code className="text-label">references/altr-hero-reference.png</code> — same
          shard assets as LEGACY, plus canvas particle dusting, pointer parallax, and
          ambient drift. Move your pointer over the scene.
        </Body>
      </div>
      <HeroPrototype />
    </main>
  );
}
