import { type NextRequest, NextResponse } from "next/server";
import { renderHomepageBundle } from "@/lib/homepage-bundle";

export const dynamic = "force-dynamic";

/**
 * Homepage. See `lib/homepage-bundle.ts` for why this is a Route Handler
 * (raw HTML, no React) rather than `page.tsx`.
 */
export function GET(request: NextRequest) {
  const nonce = request.headers.get("x-nonce") ?? "";
  const html = renderHomepageBundle(nonce);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
