import type { Metadata } from "next";
import { AuthForm, type AuthMode } from "@/components/auth/AuthForm";
import { safeNextPath } from "@/lib/auth/validation";

export const metadata: Metadata = { title: "Log in or create your Altr" };

/**
 * Same CSP-nonce-vs-static-generation fix as every other interactive
 * public page since 020 — this page is entirely client-state-driven
 * (mode switching, auth calls), so it needs a fresh per-request nonce too.
 */
export const dynamic = "force-dynamic";

export default function AuthPage({
  searchParams,
}: {
  searchParams: { mode?: string; next?: string };
}) {
  const initialMode: AuthMode = searchParams.mode === "login" ? "login" : "register";
  const next = safeNextPath(searchParams.next);

  return <AuthForm initialMode={initialMode} next={next} />;
}
