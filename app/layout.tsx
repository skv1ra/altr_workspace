import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LocaleHtmlSync } from "@/components/LocaleHtmlSync";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { getAppUrl } from "@/lib/env";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

// Domaine substitute — editorial serif reserved for the hero display type.
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-domaine",
  display: "swap",
});

// Commit Mono substitute — code blocks, identifiers, terminal-style labels.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-commit-mono",
  display: "swap",
});

const description = "A digital continuation of you, shaped by memory, style, and time.";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "Altr",
    template: "%s — Altr",
  },
  description,
  openGraph: {
    title: "Altr",
    description,
    url: "/",
    siteName: "Altr",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Altr",
    description,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F6F7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <LocaleHtmlSync />
        {children}
        {/*
          Prompt 045 — necessary-but-unlisted-file touch (`app/layout.tsx`
          isn't in this prompt's own allowed-files list, but a cookie
          banner is only meaningful mounted globally, and every route
          group's own layout is either must-not-change (`(app)`) or
          nonexistent (`(public)` has none) — see STATUS.md for the full
          reasoning, matching the established "document, don't silently
          expand scope" pattern for exactly this situation.
        */}
        <CookieConsent />
      </body>
    </html>
  );
}
