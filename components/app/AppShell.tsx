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
 * Obsidian ground by default, continuous with the landing's dark sections
 * (`Surface variant="inverse"`, same primitive `TwinDemo`/`PrivacySection`
 * already use) — `AppThemeSurface` swaps that for the light `"page"` variant
 * when the user picks "Light mode" in `UserMenu` (`lib/theme/theme-store.ts`,
 * mirroring `lib/i18n/lang-store.ts`'s own storage-consent-gated pattern).
 * This file itself stays a plain Server Component: all the interactive
 * state (mobile sheet open/close, active-route detection, language, theme)
 * lives inside `AppNav`/`UserMenu`/`AppThemeSurface`, so it never needs
 * `"use client"`. `active`/`title` props LEGACY's own `AppShell.tsx` took
 * per-page were deliberately dropped — nav active-state is derived from the
 * real URL via `usePathname()` inside `AppNav` instead of being threaded in
 * from every page, and each page renders its own heading as page content
 * (the dashboard's own greeting *is* its heading) rather than a shared
 * layout-level title slot, which would require prop-drilling through
 * `app/(app)/layout.tsx` that Next's layout/page boundary doesn't support.
 */
export function AppShell({ name, email, plan, children }: AppShellProps) {
  return (
    <AppThemeSurface className={styles.shell}>
      <AppNav name={name} email={email} plan={plan} />
      <main className={styles.content}>{children}</main>
    </AppThemeSurface>
  );
}
