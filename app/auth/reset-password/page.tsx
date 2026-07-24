import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Choose a new password" };

/** Same CSP-nonce-vs-static-generation fix as every other client-state-driven public page since 020. */
export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
