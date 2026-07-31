"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "altr_app_theme_v1";
const COOKIE_PREFERENCES_KEY = "altr_cookie_preferences_v1";

function functionalStorageAllowed() {
  if (typeof window === "undefined") return false;
  try {
    const preference = JSON.parse(window.localStorage.getItem(COOKIE_PREFERENCES_KEY) ?? "null") as { functional?: boolean } | null;
    return preference?.functional === true;
  } catch {
    return false;
  }
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined" || !functionalStorageAllowed()) return "dark";
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

export function setStoredTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  if (functionalStorageAllowed()) window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  else window.localStorage.removeItem(THEME_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent<Theme>("altr-app-theme-change", { detail: theme }));
}

/**
 * Mirrors `lib/i18n/lang-store.ts`'s `useLang` exactly (same storage-consent
 * gate, same custom-event sync across mounted instances) — the app shell's
 * theme toggle needed the identical shape, so this is that pattern applied
 * to a second, independent preference rather than a new abstraction.
 */
export function useTheme(initial: Theme = "dark") {
  const [theme, setThemeState] = useState<Theme>(initial);

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    const sync = (event: Event) => {
      setThemeState((event as CustomEvent<Theme>).detail ?? getStoredTheme());
    };
    window.addEventListener("altr-app-theme-change", sync);
    return () => window.removeEventListener("altr-app-theme-change", sync);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    setStoredTheme(next);
  };

  return [theme, setTheme] as const;
}
