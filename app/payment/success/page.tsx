import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaymentConfirmation } from "@/components/app/billing/PaymentConfirmation";
import { requireUser } from "@/lib/supabase/server";
import { Surface } from "@/components/ui/Surface";

export const metadata: Metadata = { title: "Payment" };

/**
 * `requireUser()`/`redirect(...)` on failure preserved exactly from
 * LEGACY's own `app/payment/success/page.tsx` (pinned `a22927d`) —
 * this prompt's own instruction #1 says to reuse the polling/auth logic
 * verbatim. Standalone, not wrapped in `AppShell`/the `(app)` route
 * group: same precedent `/import-conversations` (032) and
 * `/legacy-migration` already set for top-level surfaces outside the
 * dashboard shell, and — verified concretely, not just assumed — this
 * also means this page does *not* inherit `app/(app)/layout.tsx`'s own
 * `getProfileForUser()` call, which is the actual cause of the
 * placeholder-Supabase e2e block every `(app)` page has had since 029.
 * `requireUser()` here only ever needs a session, which the e2e mock
 * headers satisfy without touching real Supabase at all (see `lib/
 * testing/e2e-auth.ts`) — confirmed by curling this route with the real
 * mocked identity during this prompt's own manual verification.
 */
export default async function PaymentSuccessPage() {
  try {
    await requireUser();
  } catch {
    redirect("/auth?next=/payment/success");
  }

  return (
    <Surface variant="inverse" className="flex min-h-screen items-center justify-center px-5 py-16">
      <PaymentConfirmation />
    </Surface>
  );
}
