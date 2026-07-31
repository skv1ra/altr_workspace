import type { Metadata } from "next";
import { ImportFlow } from "@/components/app/imports/ImportFlow";
import { ImportHistory } from "@/components/app/imports/ImportHistory";
import { Surface } from "@/components/ui/Surface";
import { isConnectionProvider } from "@/lib/connections";

export const metadata: Metadata = { title: "Import conversations" };

/**
 * Same CSP-nonce-vs-static-generation fix as every other client-state-
 * driven page since 020 — this page has no server data fetch of its own
 * (limits/consent/upload are all client-side, matching LEGACY's own
 * page exactly), so without this it would be eligible for static
 * generation and serve a stale nonce.
 *
 * Standalone, not wrapped in `AppShell` — same precedent as `/auth` and
 * `/legacy-migration`: `components/app/AppShell.tsx`/`AppNav.tsx` aren't
 * in this prompt's own file scope, and LEGACY's own version used a plain
 * "← Dashboard" back link rather than a full nav rail.
 */
export const dynamic = "force-dynamic";

export default function ImportConversationsPage({ searchParams }: { searchParams: { provider?: string } }) {
  const initialPlatform = isConnectionProvider(searchParams.provider) ? searchParams.provider : "telegram";
  return (
    <Surface variant="inverse" className="min-h-screen">
      <ImportFlow initialPlatform={initialPlatform} />
      <ImportHistory />
    </Surface>
  );
}
