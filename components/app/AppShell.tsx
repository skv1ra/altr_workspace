import type { ReactNode } from "react";
import type { PlanId } from "@/lib/auth";
import { AppNav } from "./AppNav";
import { AppThemeSurface } from "./AppThemeSurface";
import styles from "./AppShell.module.css";

export interface AppShellProps {
  name: string;
  email: string;
  plan: PlanId;
  children: ReactNode;
}

/**
 * Ground for the whole `(app)` section — `AppThemeSurface` applies the
 * exact Altr App v3 tokens (`app/styles/app-v3.css`) and flips light/dark
 * via `data-v3-theme`, driven by `UserMenu`'s toggle
 * (`lib/theme/theme-store.ts`, mirroring `lib/i18n/lang-store.ts`'s own
 * storage-consent-gated pattern). This file itself stays a plain Server
 * Component: all the interactive state (mobile sheet open/close,
 * active-route detection, language, theme) lives inside
 * `AppNav`/`UserMenu`/`AppThemeSurface`, so it never needs `"use client"`.
 * `active`/`title` props LEGACY's own `AppShell.tsx` took per-page were
 * deliberately dropped — nav active-state is derived from the real URL via
 * `usePathname()` inside `AppNav` instead of being threaded in from every
 * page, and each page renders its own heading as page content (the
 * dashboard's own greeting *is* its heading) rather than a shared
 * layout-level title slot, which would require prop-drilling through
 * `app/(app)/layout.tsx` that Next's layout/page boundary doesn't support.
 */
export function AppShell({ name, email, plan, children }: AppShellProps) {
  return (
    <AppThemeSurface className={styles.shell}>
      <AppNav name={name} email={email} plan={plan} />
      <main className={styles.content}>
        <div className={styles.ambient} aria-hidden="true" />
        <div className={styles.contentInner}>{children}</div>
      </main>
    </AppThemeSurface>
  );
}
