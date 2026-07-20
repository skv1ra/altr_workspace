import { notFound } from "next/navigation";
import { Hairline, Surface } from "@/components/ui/Surface";
import { Body, Display, Heading, Label, Prose } from "@/components/ui/Text";
import { ControlsDemo } from "./ControlsDemo";
import { MotionDemo } from "./MotionDemo";
import { OverlaysDemo } from "./OverlaysDemo";

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

      <div className="space-y-8">
        <Label as="p">Materials and surfaces</Label>

        <Surface variant="page" className="hairline-top hairline-bottom space-y-2 px-6 py-8">
          <Heading level={4}>Page surface</Heading>
          <Body muted>Paper-flat --altr-white ground, graphite text, hairline top/bottom.</Body>
        </Surface>

        <Surface variant="inverse" className="space-y-2 rounded-lg px-6 py-8">
          <Heading level={4}>Inverse surface</Heading>
          <Body muted>
            Obsidian ground with a subtle facet gradient and 1px edge highlight — text
            colors invert automatically inside this surface.
          </Body>

          <Surface variant="inverse" className="mt-4 rounded-md px-4 py-4">
            <Body muted>Nested inverse (one-step elevation) — e.g. a dialog over a dark dashboard.</Body>
          </Surface>
        </Surface>

        <Surface variant="page" className="relative overflow-hidden rounded-lg px-6 py-16">
          <Surface variant="fog" aria-hidden="true" />
          <div className="relative">
            <Heading level={4}>Fog overlay</Heading>
            <Body muted>
              Decorative, pointer-events: none, and layered <em>behind</em> real content —
              it only ever lightens the page surface, so it cannot reduce text contrast.
            </Body>
          </div>
        </Surface>

        <div className="flex flex-wrap gap-6">
          <Hairline side="top" className="w-40 pt-4">
            <Label as="p" uppercase={false}>
              hairline-top
            </Label>
          </Hairline>
          <Hairline side="bottom" className="w-40 pb-4">
            <Label as="p" uppercase={false}>
              hairline-bottom
            </Label>
          </Hairline>
          <Hairline side="left" className="w-40 pl-4">
            <Label as="p" uppercase={false}>
              hairline-left
            </Label>
          </Hairline>
          <Hairline side="right" className="w-40 pr-4 text-right">
            <Label as="p" uppercase={false}>
              hairline-right
            </Label>
          </Hairline>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="rounded-lg bg-altr-white px-6 py-6 shadow-soft">
            <Label as="p" uppercase={false}>
              shadow-soft
            </Label>
          </div>
          <div className="rounded-lg bg-altr-white px-6 py-6 shadow-elevated">
            <Label as="p" uppercase={false}>
              shadow-elevated
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <Label as="p">Buttons, fields, forms</Label>
        <ControlsDemo />
      </div>

      <div className="space-y-8">
        <Label as="p">Dialogs, toasts, menus</Label>
        <OverlaysDemo />
      </div>

      <div className="space-y-8">
        <Label as="p">Motion</Label>
        <MotionDemo />
      </div>
    </main>
  );
}
