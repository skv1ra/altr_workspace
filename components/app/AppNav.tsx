"use client";

import { BrainCircuit, Bot, CreditCard, LayoutDashboard, Menu as MenuIcon, Settings as SettingsIcon, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import type { PlanId } from "@/lib/auth";
import { getSharedCopy } from "@/lib/i18n/copy";
import { useLang } from "@/lib/i18n/lang-store";
import { UserMenu } from "./UserMenu";
import styles from "./AppNav.module.css";

export interface AppNavProps {
  name: string;
  email: string;
  plan: PlanId;
}

type Destination = { href: string; label: string; icon: typeof LayoutDashboard };

/**
 * Dashboard (029), Settings (030), and now Memory (036) are real; Imports,
 * Twin, Billing, Privacy each get added to this same array by their own
 * prompt (032 already has its own standalone page but deliberately isn't
 * wrapped in `AppShell` — see `app/import-conversations/page.tsx`'s own
 * comment; 039, 042, 045) once a real page exists for them, instead of
 * linking here ahead of time (ADR-013 — no dead links). Written as a
 * data-driven list, not a hardcoded JSX block, specifically so that
 * addition is a one-line diff — exactly what Settings was, and this is.
 * `t.nav.memory` is reused as-is from the public header (019) rather than
 * a new duplicate string.
 */
function useDestinations(): Destination[] {
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang);
  return [
    { href: "/dashboard", label: t.common.backDashboard, icon: LayoutDashboard },
    { href: "/memory", label: t.nav.memory, icon: BrainCircuit },
    { href: "/assistants", label: t.nav.assistants, icon: Bot },
    { href: "/import-conversations", label: t.nav.imports, icon: Upload },
    { href: "/billing", label: t.nav.billing, icon: CreditCard },
    { href: "/privacy-center", label: t.nav.privacy, icon: ShieldCheck },
    { href: "/settings", label: t.settings.heading, icon: SettingsIcon },
  ];
}

/**
 * Same faceted shard silhouette as `components/site/Logo.tsx`, redrawn with
 * `fill-text-primary`/`fill-text-muted` instead of hardcoded obsidian/silver
 * — that version is tuned for the always-light marketing header, this rail
 * needs to read on both the dark and light `AppThemeSurface` states, and the
 * `text-primary`/`text-muted` tokens already re-scope per surface
 * (materials.css) so a plain color swap isn't enough on its own.
 */
function AppMark() {
  return (
    <svg aria-hidden="true" width="16" height="18" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 0L1 18H9V0Z" className="fill-text-primary" />
      <path d="M9 0L17 18H9V0Z" className="fill-text-muted" />
    </svg>
  );
}

function NavLinks({ destinations, pathname, onNavigate }: { destinations: Destination[]; pathname: string; onNavigate?: () => void }) {
  return (
    <ul className={styles.list}>
      {destinations.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={active ? `${styles.item} ${styles.itemActive}` : styles.item}
            >
              <Icon aria-hidden="true" width={18} height={18} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Desktop: a slim static rail — active state is a quiet left-edge hairline
 * (`.itemActive`, `AppNav.module.css`), never a filled pill, per this
 * prompt's own visual requirement. Mobile: collapses to a compact topbar
 * (home link + a single menu trigger) that opens a bottom sheet built on
 * the shared `Dialog` primitive (`tone="dark"`, same focus-trap/Escape/
 * backdrop/scroll-lock machinery `MobileMenu` already reuses for the
 * public header) rather than LEGACY's own persistent bottom icon-bar —
 * this prompt's own spec asks for "bottom-sheet nav", a distinct pattern
 * from LEGACY's always-visible bar.
 */
export function AppNav({ name, email, plan }: AppNavProps) {
  const pathname = usePathname();
  const [lang] = useLang("EN");
  const t = getSharedCopy(lang);
  const destinations = useDestinations();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className={styles.rail}>
        <Link href="/dashboard" className={styles.wordmark}>
          <AppMark />
          Altr
        </Link>
        <nav aria-label="Product navigation">
          <NavLinks destinations={destinations} pathname={pathname} />
        </nav>
        <UserMenu name={name} email={email} plan={plan} />
      </aside>

      <div className={styles.mobileBar}>
        <Link href="/dashboard" className={styles.wordmark}>
          <AppMark />
          Altr
        </Link>
        <button
          type="button"
          className={`${styles.trigger} control-focus`}
          aria-label={t.nav.menu}
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <MenuIcon aria-hidden="true" width={20} height={20} strokeWidth={1.6} />
        </button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={t.nav.menuTitle} tone="dark" className={styles.sheet}>
        <nav aria-label="Product navigation">
          <NavLinks destinations={destinations} pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
        <UserMenu name={name} email={email} plan={plan} />
      </Dialog>
    </>
  );
}
