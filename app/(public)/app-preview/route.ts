import { type NextRequest, NextResponse } from "next/server";
import { renderAppPreviewBundle } from "@/lib/app-preview-bundle";

export const dynamic = "force-dynamic";

/**
 * `/app-preview`. See `lib/app-preview-bundle.ts` for why this is a Route
 * Handler (raw HTML, no React) rather than `page.tsx`.
 */
export function GET(request: NextRequest) {
  const nonce = request.headers.get("x-nonce") ?? "";
  const html = renderAppPreviewBundle(nonce);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
