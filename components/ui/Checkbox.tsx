"use client";

import { Check, Minus } from "lucide-react";
import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label: ReactNode;
  indeterminate?: boolean;
  error?: string;
}

/** Custom-drawn (consent flows use it) with indeterminate support. The real
 *  checkbox stays in the DOM (sr-only) for native semantics/keyboard toggle;
 *  the visible box is purely decorative and mirrors its state. */
export function Checkbox({ label, indeterminate = false, error, checked, id, ...rest }: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div>
      <label htmlFor={inputId} className="flex min-h-[44px] cursor-pointer items-center gap-3">
        <input
          ref={inputRef}
          id={inputId}
          type="checkbox"
          checked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="peer sr-only"
          {...rest}
        />
        <span
          className="checkbox-control peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--control-focus-ring)]"
          data-checked={checked ? "true" : "false"}
          data-indeterminate={indeterminate ? "true" : "false"}
          aria-hidden="true"
        >
          {indeterminate ? (
            <Minus className="h-3 w-3" />
          ) : checked ? (
            <Check className="h-3 w-3" />
          ) : null}
        </span>
        <span className="text-body text-text-primary">{label}</span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-label normal-case text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
