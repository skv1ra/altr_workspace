"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { Body } from "@/components/ui/Text";
import { getSharedCopy } from "@/lib/i18n/copy";
import type { Lang } from "@/lib/i18n/lang-store";

type Scope = "all" | "account" | "conversations" | "memory";

/** `POST /api/privacy/deletion-requests` (must-not-change) — exact
 *  contract: `{ email, scope, reason?, confirmed: true }`, `202` with
 *  `{ ok: true, reference }` on success. Available signed-in or
 *  signed-out (this route uses `getOptionalUser`, never `requireUser`),
 *  matching LEGACY's real `/data-deletion/request` form field-for-field. */
export function DeletionRequestForm({ lang, defaultEmail = "" }: { lang: Lang; defaultEmail?: string }) {
  const t = getSharedCopy(lang).privacy;
  const [email, setEmail] = useState(defaultEmail);
  const [scope, setScope] = useState<Scope>("all");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const scopeOptions = [
    { value: "all", label: t.requestScopeAll },
    { value: "account", label: t.requestScopeAccount },
    { value: "conversations", label: t.requestScopeConversations },
    { value: "memory", label: t.requestScopeMemory },
  ];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!confirmed) {
      setError(t.requestErrorConfirm);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/privacy/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), scope, reason: reason.trim() || undefined, confirmed: true }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: true; reference?: string; error?: string };
      if (!response.ok || !body.reference) {
        setError(response.status === 429 ? t.requestRateLimited : t.requestFailedGeneric);
        return;
      }
      setReference(body.reference);
    } catch {
      setError(t.requestFailedGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div>
        <h2 className="text-h4 font-normal text-text-primary">{t.requestSuccessTitle}</h2>
        <Body muted className="mt-2">
          {t.requestSuccessReference}: <strong className="text-text-primary">{reference}</strong>
        </Body>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField label={t.requestEmailLabel} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
      <Select
        label={t.requestScopeLabel}
        value={scope}
        onChange={(event) => setScope(event.target.value as Scope)}
        options={scopeOptions}
      />
      <Field label={t.requestReasonLabel}>
        {({ id, describedBy }) => (
          <textarea id={id} aria-describedby={describedBy} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} className="field-input control-focus" />
        )}
      </Field>
      <Checkbox label={t.requestConfirmLabel} checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
      {error && (
        <p role="alert" className="text-body text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" variant="danger" loading={submitting} disabled={submitting} className="w-full">
        {submitting ? t.requestSubmitting : t.requestSubmit}
      </Button>
    </form>
  );
}
