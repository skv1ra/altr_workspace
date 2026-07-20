"use client";

import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { Field } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
}

/** A real native <select> (restyled, not rebuilt) — Windows/every browser's
 *  native keyboard nav (arrows, type-ahead) works with zero extra JS. */
export function Select({ label, help, error, required, options, className, ...rest }: SelectProps) {
  return (
    <Field label={label} help={help} error={error} required={required}>
      {({ id, describedBy }) => (
        <span className="relative flex items-center">
          <select
            id={id}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
            className={`field-select control-focus ${className ?? ""}`}
            {...rest}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-1 h-4 w-4 text-text-muted"
            aria-hidden="true"
          />
        </span>
      )}
    </Field>
  );
}
