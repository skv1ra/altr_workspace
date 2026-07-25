"use client";

import type { ReactNode } from "react";
import { Surface } from "@/components/ui/Surface";
import { Body, Display, Label } from "@/components/ui/Text";

export interface PaymentNoticeProps {
  icon: ReactNode;
  eyebrow: string;
  heading: string;
  body: string;
  actions: ReactNode;
}

/**
 * Shared shell for the two plain informational return surfaces (cancel,
 * `/billing/return`) — same dark-ground-plus-floating-panel composition
 * `PaymentConfirmation` uses (nested `Surface variant="inverse"`, one
 * step lighter + shadowed per `materials.css`'s own nested-inverse rule),
 * genuinely reused rather than duplicated since both callers need the
 * identical structure with only copy/actions differing.
 */
export function PaymentNotice({ icon, eyebrow, heading, body, actions }: PaymentNoticeProps) {
  return (
    <Surface variant="inverse" className="flex min-h-screen items-center justify-center px-5 py-16">
      <Surface variant="inverse" className="mx-auto w-full max-w-xl rounded-2xl px-8 py-12 text-center">
        {icon}
        <Label className="mt-6 block">{eyebrow}</Label>
        <Display as="h1" className="mt-4">
          {heading}
        </Display>
        <Body muted className="mx-auto mt-4 max-w-md">
          {body}
        </Body>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
      </Surface>
    </Surface>
  );
}
