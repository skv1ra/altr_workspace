"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { ZodIssue } from "zod";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { PasswordField } from "@/components/ui/PasswordField";
import { Surface } from "@/components/ui/Surface";
import { TextField } from "@/components/ui/TextField";
import { getCurrentProfile, registerAccount, signInAccount, signInWithGoogle } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/auth/validation";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { LEGAL_VERSION } from "@/lib/legal";
import styles from "./AuthForm.module.css";

export type AuthMode = "register" | "login";

/**
 * Both `app/api/auth/{register,login}/route.ts` (must-not-change) throw
 * this exact hardcoded string for a 429 — `lib/auth.ts`'s shared `api()`
 * helper (also must-not-change) discards the HTTP status code whenever the
 * server includes a JSON `error` field, which both routes always do, so
 * this literal-string match is the only way to show the calm "try again
 * shortly" 429 state this prompt requires without touching either
 * forbidden file. Confirmed identical in both route handlers by reading
 * the source, not guessed.
 */
const RATE_LIMIT_MESSAGE = "Забагато спроб. Спробуй пізніше.";

/** Legacy never asks for a typed name — it derives one from the email's
 *  local part. Preserved exactly (same behavioral contract, one less field
 *  of friction on the form). */
function nameFromEmail(email: string) {
  const raw = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Altr user";
  const normalized = raw.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return normalized.length >= 2 ? normalized.slice(0, 120) : "Altr user";
}

function firstIssueMessage(issues: ZodIssue[], t: ReturnType<typeof getSharedCopy>["authPage"]["errors"]) {
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === "email") return t.email;
    if (key === "password") return t.password;
    if (key === "termsAccepted" || key === "conversationProcessingAccepted" || key === "aiMemoryAccepted") {
      return t.consent;
    }
  }
  return t.generic;
}

export function AuthForm({ initialMode, next }: { initialMode: AuthMode; next: string }) {
  const router = useRouter();
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang).authPage;
  const footerCopy = getSharedCopy(lang).footer;

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedConversations, setAcceptedConversations] = useState(false);
  const [acceptedMemory, setAcceptedMemory] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void getCurrentProfile().then((profile) => {
      if (active && profile) router.replace("/dashboard");
    });
    return () => {
      active = false;
    };
  }, [router]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    const params = new URLSearchParams({ mode: nextMode });
    if (next !== "/dashboard") params.set("next", next);
    window.history.replaceState(null, "", `/auth?${params.toString()}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A double-click can fire this handler twice before React commits the
    // `disabled` state onto the submit button — this guard is the actual
    // protection, the disabled button is only the visible half of it.
    if (submitting) return;
    setError("");
    setNotice("");

    if (mode === "register") {
      const result = registerSchema.safeParse({
        name: nameFromEmail(email),
        email,
        password,
        termsAccepted: acceptedTerms,
        conversationProcessingAccepted: acceptedConversations,
        aiMemoryAccepted: acceptedMemory,
        policyVersion: LEGAL_VERSION,
        locale: lang === "UA" ? "uk-UA" : "en-US",
      });
      if (!result.success) return setError(firstIssueMessage(result.error.issues, t.errors));

      setSubmitting(true);
      try {
        const response = await registerAccount(result.data);
        if (response.requiresEmailVerification) {
          setNotice(t.verification);
          return;
        }
        router.replace(next);
        router.refresh();
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "";
        setError(message === RATE_LIMIT_MESSAGE ? t.errors.rateLimited : t.errors.generic);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) return setError(firstIssueMessage(result.error.issues, t.errors));

    setSubmitting(true);
    try {
      await signInAccount(result.data.email, result.data.password);
      router.replace(next);
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      setError(message === RATE_LIMIT_MESSAGE ? t.errors.rateLimited : t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <Surface variant="page" as="section" className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.topline}>
            <Logo />
            <Link href="/" className={styles.back}>
              <ArrowLeft aria-hidden="true" width={16} height={16} strokeWidth={1.5} />
              {t.backHome}
            </Link>
          </div>

          <p className="mt-8 text-label uppercase text-text-muted">
            {mode === "register" ? t.registerEyebrow : t.loginEyebrow}
          </p>
          <h1 className="mt-4 text-h1 font-normal text-text-primary">
            {mode === "register" ? t.registerTitle : t.loginTitle}
          </h1>
          <p className="mt-3 text-body text-text-muted">{mode === "register" ? t.registerBody : t.loginBody}</p>

          <Button variant="secondary" onClick={() => void signInWithGoogle()} className={styles.google}>
            {t.google}
          </Button>
          <div className={styles.divider}>
            <span>{t.divider}</span>
          </div>

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <TextField
              label={t.emailLabel}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <PasswordField
              label={t.passwordLabel}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {mode === "login" && (
              <Link href="/auth/forgot-password" className={styles.forgot}>
                {t.forgot}
              </Link>
            )}

            {mode === "register" && (
              <details className={styles.consents}>
                <summary>{t.legalSummary}</summary>
                <div className={styles.consentList}>
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    label={
                      <>
                        {t.consentTerms}{" "}
                        <Link href="/terms" target="_blank" className={styles.inlineLink}>
                          {footerCopy.termsLink}
                        </Link>{" "}
                        {t.consentTermsAnd}{" "}
                        <Link href="/privacy" target="_blank" className={styles.inlineLink}>
                          {footerCopy.privacyLink}
                        </Link>
                        .
                      </>
                    }
                  />
                  <Checkbox
                    checked={acceptedConversations}
                    onChange={(event) => setAcceptedConversations(event.target.checked)}
                    label={t.consentConversations}
                  />
                  <Checkbox
                    checked={acceptedMemory}
                    onChange={(event) => setAcceptedMemory(event.target.checked)}
                    label={t.consentMemory}
                  />
                </div>
              </details>
            )}

            {error && (
              <p role="alert" className={styles.alert}>
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className={styles.notice}>
                {notice}
              </p>
            )}

            <Button type="submit" loading={submitting} className={styles.submit}>
              {mode === "register" ? t.registerSubmit : t.loginSubmit}
            </Button>
          </form>

          <p className={styles.switchPrompt}>
            {mode === "register" ? t.registerPrompt : t.loginPrompt}{" "}
            <button type="button" onClick={() => switchMode(mode === "register" ? "login" : "register")}>
              {mode === "register" ? t.registerLink : t.loginLink}
            </button>
          </p>
        </div>
      </Surface>
    </div>
  );
}
