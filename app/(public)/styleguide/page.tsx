import { notFound } from "next/navigation";
import { Body, Display, Heading, Label, Prose } from "@/components/ui/Text";

export const metadata = { title: "Styleguide" };

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="section-stack mx-auto max-w-4xl space-y-16 px-6">
      <div className="space-y-4">
        <Label as="p">Internal / dev only</Label>
        <Display>Your past learns to remain.</Display>
      </div>

      <div className="space-y-8">
        <Heading level={1}>Heading level one</Heading>
        <Heading level={2}>Heading level two</Heading>
        <Heading level={3}>Heading level three</Heading>
        <Heading level={4}>Heading level four</Heading>
      </div>

      <div className="space-y-4">
        <Body>
          Body copy sits at 1.6 leading and is capped to a 68-character measure so
          long paragraphs stay comfortable to read.
        </Body>
        <Body muted>Muted body copy, used for secondary explanations.</Body>
      </div>

      <div>
        <Label>Label / metadata</Label>
      </div>

      <Prose>
        <Heading level={3}>Prose block</Heading>
        <Body>
          Prose composes Heading and Body children with consistent vertical rhythm —
          used for legal and other long-form pages.
        </Body>
        <Body>Твоє минуле вчиться залишатися. Кирилиця рендериться тим самим шрифтом.</Body>
      </Prose>
    </main>
  );
}
