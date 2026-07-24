import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Toaster } from "@/components/ui/Toaster";
import { getProfileForUser } from "@/lib/profileServer";
import { requireUser } from "@/lib/supabase/server";

/**
 * `middleware.ts` (unmodified) already redirects anonymous requests for
 * every route under this group before this layout ever renders — see its
 * `pages` list, which includes `/dashboard`. `requireUser()` here is not a
 * second gate; it's simply how this Server Component gets the session it
 * already knows exists, the same call `app/api/me/route.ts` makes.
 *
 * `<Toaster />` mounted here for the first time in this workspace —
 * `components/ui/Toast.tsx`'s own module comment (010) explicitly
 * anticipated this: "the first screen prompt that needs toasts for real
 * should mount `<Toaster />` at the root layout." Prompt 037's own
 * "optimistic-free (server confirm → list refresh → toast)" instruction
 * is that prompt. Mounted at this `(app)` layout rather than the true
 * root (`app/layout.tsx`, outside every prompt's file scope so far) since
 * every current toast-triggering action lives under this route group —
 * a narrower, still-correct deviation.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);

  return (
    <>
      <AppShell name={profile.name} email={profile.email} plan={profile.plan}>
        {children}
      </AppShell>
      <Toaster />
    </>
  );
}
