import { headers } from "next/headers";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function LegacyMigrationLayout({ children }: { children: ReactNode }) {
  // Reading request headers makes this route tree request-bound in Next.js 14.
  // The per-request render is required so middleware's CSP nonce is applied to
  // the client hydration scripts that power the migration actions.
  void headers();
  return children;
}
