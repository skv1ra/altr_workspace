"use client";

import { useState } from "react";
import { signOutAccount } from "@/lib/auth";

export type DeletionStep = "consequences" | "confirm" | "success";

interface DeletionState {
  step: DeletionStep;
  email: string;
  phrase: string;
  reason: string;
  submitting: boolean;
  errorKey: "staleSession" | "emailMismatch" | "rateLimited" | "generic" | null;
  reference: string | null;
}

function initialStateFor(initialEmail: string): DeletionState {
  return {
    step: "consequences",
    email: initialEmail,
    phrase: "",
    reason: "",
    submitting: false,
    errorKey: null,
    reference: null,
  };
}

const CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

/**
 * Shared ceremony logic for `DELETE /api/privacy/account` (must-not-change,
 * the real audited route — never `lib/auth.ts`'s `deleteCurrentAccount()`/
 * `DELETE /api/me`, a separate, unwired, structurally weaker duplicate
 * with no anonymization/storage-cleanup/audit-trail step of its own; see
 * RISKS.md for why that path is never used here). One hook, consumed by
 * both `AccountDeletionDialog` (in-app Privacy Center) and
 * `AccountDeletionPanel` (the public `/delete-data` and
 * `/data-deletion/request` pages) so the real fetch/validation logic
 * exists exactly once.
 */
export function useAccountDeletion(onDeleted?: () => void, initialEmail = "") {
  const [state, setState] = useState<DeletionState>(() => initialStateFor(initialEmail));

  function reset() {
    setState(initialStateFor(initialEmail));
  }

  function goToConfirm() {
    setState((current) => ({ ...current, step: "confirm", errorKey: null }));
  }

  function setEmail(email: string) {
    setState((current) => ({ ...current, email }));
  }

  function setPhrase(phrase: string) {
    setState((current) => ({ ...current, phrase }));
  }

  function setReason(reason: string) {
    setState((current) => ({ ...current, reason }));
  }

  const canSubmit = state.phrase === CONFIRMATION_PHRASE && state.email.trim().length > 0 && !state.submitting;

  async function submit() {
    if (!canSubmit) return;
    setState((current) => ({ ...current, submitting: true, errorKey: null }));
    try {
      const response = await fetch("/api/privacy/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email.trim(), confirmation: state.phrase, reason: state.reason.trim() || undefined }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: true; reference?: string; error?: string };
      if (!response.ok || !body.ok) {
        const errorKey =
          response.status === 429
            ? "rateLimited"
            : response.status === 403 && body.error === "Please sign in again before deleting your account."
              ? "staleSession"
              : response.status === 403
                ? "emailMismatch"
                : "generic";
        setState((current) => ({ ...current, submitting: false, errorKey }));
        return;
      }
      setState((current) => ({ ...current, submitting: false, step: "success", reference: body.reference ?? null }));
      await signOutAccount().catch(() => {});
      onDeleted?.();
    } catch {
      setState((current) => ({ ...current, submitting: false, errorKey: "generic" }));
    }
  }

  return { state, reset, goToConfirm, setEmail, setPhrase, setReason, canSubmit, submit, CONFIRMATION_PHRASE };
}
