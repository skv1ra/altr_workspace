"use client";

import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";
import { requestPasswordReset } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { AuthVisual } from "./AuthVisual";
import styles from "./AuthForm.module.css";

/**
 * `/api/auth/forgot-password/route.ts` (must-not-change) is the one auth
 * route that reports its 429 under a `message` field rather than `error` —
 * `lib/auth.ts`'s shared `api()` helper only special-cases `error`, so a
 * rate limit here surfaces as the generic `REQUEST_FAILED_429` string
 * instead of the literal Ukrainian sentence AuthForm matches on. Confirmed
 * by reading both files, not guessed — this is the correct string to match.
 */
const RATE_LIMITED = "REQUEST_FAILED_429";

/**
 * Single-field recovery request. The neutral "sent" confirmation is shown
 * for every non-rate-limited outcome — success or failure, existing account
 * or not — because `/api/auth/forgot-password` itself already replies with
 * the same shape either way (its own `MESSAGE` constant, read from source).
 * This component doesn't even inspect the server's response body for that
 * reason: showing our own fixed, bilingual copy on any non-429 outcome is
 * simpler than parsing a Ukrainian-only server string and just as correct,
 * since the two cases are contractually identical from the server's side.
 */
export function ForgotPasswordForm() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).recoveryPage;
  const authT = getSharedCopy(lang).authPage;

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      if (message === RATE_LIMITED) setError(authT.errors.rateLimited);
      else setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <AuthVisual lang={lang} />

      <Surface variant="page" as="section" className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.topline}>
            <Logo />
            <Link href="/" className={styles.back}>
              <ArrowLeft aria-hidden="true" width={16} height={16} strokeWidth={1.5} />
              {authT.backHome}
            </Link>
          </div>

          {sent ? (
            <div className="mt-8">
              <Mail aria-hidden="true" width={28} height={28} strokeWidth={1.25} className="text-text-muted" />
              <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.forgotSentTitle}</h1>
              <p role="status" className="mt-3 max-w-[46ch] text-body text-text-muted">
                {t.forgotSentBody}
              </p>
              <p className={styles.switchPrompt}>
                <Link href="/auth?mode=login" className="font-medium text-text-primary underline underline-offset-[3px]">
                  {t.backToLogin}
                </Link>
              </p>
            </div>
          ) : (
            <>
              <p className="mt-8 text-label uppercase text-text-muted">{t.forgotEyebrow}</p>
              <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.forgotTitle}</h1>
              <p className="mt-3 max-w-[46ch] text-body text-text-muted">{t.forgotBody}</p>

              <form onSubmit={handleSubmit} noValidate className={`${styles.form} mt-8`}>
                <TextField
                  label={authT.emailLabel}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                {error && (
                  <p role="alert" className={styles.alert}>
                    {error}
                  </p>
                )}

                <Button type="submit" loading={submitting} className={styles.submit}>
                  {t.forgotSubmit}
                </Button>
              </form>

              <p className={styles.switchPrompt}>
                <Link href="/auth?mode=login" className="font-medium text-text-primary underline underline-offset-[3px]">
                  {t.backToLogin}
                </Link>
              </p>
            </>
          )}
        </div>
      </Surface>
    </div>
  );
}
