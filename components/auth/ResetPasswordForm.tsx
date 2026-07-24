"use client";

import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { Surface } from "@/components/ui/Surface";
import { getCurrentProfile, resetPassword } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { AuthVisual } from "./AuthVisual";
import styles from "./AuthForm.module.css";

/**
 * `/api/auth/reset-password/route.ts` (must-not-change) reports its 429 and
 * its no-session state under an `error` field, so `lib/auth.ts`'s shared
 * `api()` helper surfaces those two exact literal strings (read from
 * source, not guessed) rather than the generic `REQUEST_FAILED_*` fallback
 * `ForgotPasswordForm` has to special-case for the sibling route.
 */
const RATE_LIMITED = "Забагато спроб. Спробуй пізніше.";
const SESSION_REQUIRED = "RESET_SESSION_REQUIRED";

type Status = "checking" | "invalid" | "form" | "success";

/**
 * `resetPassword()` (`lib/auth.ts`, must-not-change) always sends
 * `confirmPassword` equal to `password` itself — the schema's
 * password-match refinement is trivially satisfied server-side, so the
 * actual "did the user type the same thing twice" check has to happen here,
 * client-side, before calling it at all. Same behavioral gap LEGACY's own
 * `app/auth/reset-password/page.tsx` filled the same way.
 *
 * Unlike LEGACY (which renders the form unconditionally and only surfaces
 * the raw `RESET_SESSION_REQUIRED` string as a plain error if submit
 * fails), this version checks session validity up front via
 * `getCurrentProfile()` so a used/expired/wrong-browser link shows this
 * prompt's own required designed error state immediately, before the user
 * types anything — see the completion report for exactly which recovery
 * failure modes route through `/auth/callback` (unmodified, already
 * same-origin-safe) versus land here.
 */
export function ResetPasswordForm() {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).recoveryPage;
  const authT = getSharedCopy(lang).authPage;

  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void getCurrentProfile().then((profile) => {
      if (active) setStatus(profile ? "form" : "invalid");
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) return setError(authT.errors.password);
    if (password !== confirmPassword) return setError(t.resetMismatch);

    setSubmitting(true);
    try {
      await resetPassword(password);
      setStatus("success");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      if (message === SESSION_REQUIRED) setStatus("invalid");
      else if (message === RATE_LIMITED) setError(authT.errors.rateLimited);
      else setError(authT.errors.generic);
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

          {status === "checking" && (
            <p className="mt-8 text-body text-text-muted">{getSharedCopy(lang).common.loading}…</p>
          )}

          {status === "invalid" && (
            <div className="mt-8">
              <AlertTriangle aria-hidden="true" width={28} height={28} strokeWidth={1.25} className="text-red-700" />
              <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.invalidTitle}</h1>
              <p className="mt-3 max-w-[46ch] text-body text-text-muted">{t.invalidBody}</p>
              <Link href="/auth/forgot-password" className={`${styles.submit} btn btn-primary control-focus mt-8 inline-flex items-center justify-center`}>
                {t.invalidCta}
              </Link>
            </div>
          )}

          {status === "success" && (
            <div className="mt-8">
              <ShieldCheck aria-hidden="true" width={28} height={28} strokeWidth={1.25} className="text-text-muted" />
              <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.successTitle}</h1>
              <p role="status" className="mt-3 max-w-[46ch] text-body text-text-muted">
                {t.successBody}
              </p>
              <Link href="/dashboard" className={`${styles.submit} btn btn-primary control-focus mt-8 inline-flex items-center justify-center`}>
                {t.successCta}
              </Link>
            </div>
          )}

          {status === "form" && (
            <>
              <p className="mt-8 text-label uppercase text-text-muted">{t.resetEyebrow}</p>
              <h1 className="mt-4 text-h1 font-normal text-text-primary">{t.resetTitle}</h1>
              <p className="mt-3 max-w-[46ch] text-body text-text-muted">{t.resetBody}</p>

              <form onSubmit={handleSubmit} noValidate className={`${styles.form} mt-8`}>
                <PasswordField
                  label={authT.passwordLabel}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <PasswordField
                  label={t.confirmPasswordLabel}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />

                {error && (
                  <p role="alert" className={styles.alert}>
                    {error}
                  </p>
                )}

                <Button type="submit" loading={submitting} className={styles.submit}>
                  {t.resetSubmit}
                </Button>
              </form>
            </>
          )}
        </div>
      </Surface>
    </div>
  );
}
