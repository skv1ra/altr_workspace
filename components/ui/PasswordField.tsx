"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { Field } from "./Field";

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "autoComplete"> {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  /** Required, not optional — forces every call site to pick the correct value. */
  autoComplete: "current-password" | "new-password";
}

/** Never logs or echoes the password value; only renders/toggles visibility. */
export function PasswordField({
  label,
  help,
  error,
  required,
  autoComplete,
  className,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} help={help} error={error} required={required}>
      {({ id, describedBy }) => (
        <span className="field-input-row">
          <input
            id={id}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
            className={`field-input control-focus ${className ?? ""}`}
            {...rest}
          />
          <button
            type="button"
            className="field-toggle control-focus"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </span>
      )}
    </Field>
  );
}
