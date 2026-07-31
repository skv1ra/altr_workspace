"use client";

import type { ReactNode } from "react";
import { Surface } from "@/components/ui/Surface";
import { useTheme } from "@/lib/theme/theme-store";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Ground for the whole `(app)` section. Two token systems layered here,
 * deliberately: `Surface variant="inverse"/"page"` keeps every shared
 * primitive (`Button`, `Dialog`, `Toast`, `Field`, `Checkbox`, ...) working
 * exactly as it already does elsewhere in this app, via the marketing
 * site's `--text-primary`/`--edge-hairline`/`.surface-inverse` system —
 * those components are also used outside `(app)` (onboarding, auth) and
 * must keep behaving identically there. `.app-v3` (`app/styles/app-v3.css`)
 * adds the *exact* Altr App v3 tokens on top, extracted directly from the
 * Claude Design bundle, for the bespoke markup this redesign authors
 * directly (headings, panel cards, chips, stat numerals) — those never had
 * a `Surface`-based equivalent to reuse. `data-v3-theme` drives the v3
 * light/dark override block; the toggle in `UserMenu` flips both this
 * attribute and the `Surface` variant together.
 */
export function AppThemeSurface({ className, children }: { className?: string; children: ReactNode }) {
  const [theme] = useTheme("dark");
  return (
    <Surface
      variant={theme === "dark" ? "inverse" : "page"}
      className={cx("app-v3", className)}
      data-v3-theme={theme}
    >
      {children}
    </Surface>
  );
}
