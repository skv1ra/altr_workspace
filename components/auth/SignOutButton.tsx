"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { signOutAccount } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";

/**
 * No page in this workspace mounts this yet — LEGACY's own equivalent lived
 * inside `app/dashboard/page.tsx` (sidebar + settings tab), which is
 * Prompt 029's own scope, not this one's. Built and tested standalone so
 * 029+ can drop it in directly.
 *
 * On success: dispatches `altr-auth-change` (the same event `Header`
 * already listens for, since 019, but nothing has dispatched until now) so
 * any already-mounted component holding "signed in" state in memory —
 * `Header` today, dashboard surfaces once they exist — re-checks
 * `/api/me` and clears it, satisfying this prompt's "clears client caches
 * of user data held in memory" requirement without those components
 * needing any sign-out-specific code of their own.
 */
export function SignOutButton({ variant = "ghost", className, ...rest }: Omit<ButtonProps, "children" | "loading" | "onClick">) {
  const router = useRouter();
  const [lang] = useLang("EN");
  const [pending, setPending] = useState(false);
  const t = getSharedCopy(lang).signOut;

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await signOutAccount();
      window.dispatchEvent(new Event("altr-auth-change"));
      toast.push(t.confirmed);
      router.replace("/");
      router.refresh();
    } catch {
      toast.push(t.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant={variant} loading={pending} onClick={() => void handleClick()} className={className} {...rest}>
      <LogOut aria-hidden="true" width={16} height={16} strokeWidth={1.5} />
      {t.label}
    </Button>
  );
}
