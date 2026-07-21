import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LocaleHtmlSync } from "@/components/LocaleHtmlSync";
import { getAppUrl } from "@/lib/env";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
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
  themeColor: "#F5F6F7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <LocaleHtmlSync />
        {children}
      </body>
    </html>
  );
}
