"use client";

import type { ReactNode } from "react";
import { openCookiePreferences } from "@/lib/legal/cookie-store";

export function CookiePreferencesButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={openCookiePreferences} className={className}>
      {children}
    </button>
  );
}
