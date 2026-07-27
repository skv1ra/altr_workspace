"use client";

import { useId, type ReactNode } from "react";

export interface FieldRenderProps {
  id: string;
  describedBy: string | undefined;
}

export interface FieldProps {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: (render: FieldRenderProps) => ReactNode;
}

/**
 * Shared label/help/error scaffolding for TextField/PasswordField/Select.
 * Top-aligned labels (not floating) — chosen for native label/input
 * association with zero JS and no risk of overlapping placeholder text at
 * small viewport widths; documented per this prompt's "pick one" instruction.
 *
 * Error paragraphs use `role="alert"` with no other wrapper — this is the
 * legacy e2e contract (`p[role="alert"]`) and must not change shape.
 */
export function Field({ label, help, error, required, children }: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label uppercase text-text-muted">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children({ id, describedBy })}
      {help && !error && (
        <p id={helpId} className="text-label normal-case text-text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-label normal-case text-alarm-red">
          {error}
        </p>
      )}
    </div>
  );
}
