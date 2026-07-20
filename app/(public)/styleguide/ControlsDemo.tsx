"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { PasswordField } from "@/components/ui/PasswordField";
import { Select } from "@/components/ui/Select";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";

/**
 * Client-only demo wrapper so the controls section is genuinely interactive
 * (real click/keyboard/loading behavior), not a frozen static mockup — the
 * page itself stays a server component.
 */
export function ControlsDemo() {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button
          variant="primary"
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          {loading ? "Loading…" : "Click to load"}
        </Button>
      </div>

      <Surface variant="inverse" className="flex flex-wrap items-center gap-4 rounded-lg px-6 py-6">
        <Button variant="primary">Primary on dark</Button>
        <Button variant="secondary">Secondary on dark</Button>
        <Button variant="ghost">Ghost on dark</Button>
      </Surface>

      <div className="grid max-w-md gap-6">
        <TextField label="Email" type="email" placeholder="you@example.com" />
        <TextField label="Email" error="Enter a valid email address." defaultValue="not-an-email" />
        <PasswordField label="Password" autoComplete="new-password" help="At least 8 characters." />
        <Select
          label="Category"
          options={[
            { value: "work", label: "Work" },
            { value: "personal", label: "Personal" },
          ]}
        />
        <TextField label="Disabled field" disabled defaultValue="Can't edit this" />
      </div>

      <div className="space-y-3">
        <Checkbox
          label="I accept the Terms and Privacy Policy."
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <Checkbox label="Indeterminate example" indeterminate checked={false} onChange={() => {}} />
        <Checkbox
          label="This permission is required."
          checked={false}
          onChange={() => {}}
          error="Confirm this permission to continue."
        />
      </div>
    </div>
  );
}
