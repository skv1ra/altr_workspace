"use client";

import type { InputHTMLAttributes } from "react";
import { Field } from "./Field";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
}

export function TextField({ label, help, error, required, className, ...rest }: TextFieldProps) {
  return (
    <Field label={label} help={help} error={error} required={required}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          className={`field-input control-focus ${className ?? ""}`}
          {...rest}
        />
      )}
    </Field>
  );
}
