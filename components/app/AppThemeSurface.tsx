"use client";

import type { ReactNode } from "react";
import { Surface } from "@/components/ui/Surface";
import { useTheme } from "@/lib/theme/theme-store";

/**
 * The `(app)` ground defaults to the inverse (dark) surface — matching the
 * Altr App v3 design's default — but the same token architecture that
 * powers `.surface-inverse`/`.surface-page` (materials.css: every
 * `text-text-primary`/`text-text-muted` consumer re-scopes automatically to
 * whichever surface class wraps it) already supports a real light ground,
 * so the toggle in `AppNav`/`UserMenu` just swaps this one class rather
 * than needing a parallel light-mode stylesheet.
 */
export function AppThemeSurface({ className, children }: { className?: string; children: ReactNode }) {
  const [theme] = useTheme("dark");
  return (
    <Surface variant={theme === "dark" ? "inverse" : "page"} className={className}>
      {children}
    </Surface>
  );
}
