import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { getProfileForUser } from "@/lib/profileServer";
import { requireUser } from "@/lib/supabase/server";

/**
 * `middleware.ts` (unmodified) already redirects anonymous requests for
 * every route under this group before this layout ever renders — see its
 * `pages` list, which includes `/dashboard`. `requireUser()` here is not a
 * second gate; it's simply how this Server Component gets the session it
 * already knows exists, the same call `app/api/me/route.ts` makes.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);

  return (
    <AppShell name={profile.name} email={profile.email} plan={profile.plan}>
      {children}
    </AppShell>
  );
}
