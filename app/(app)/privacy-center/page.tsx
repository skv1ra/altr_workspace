import type { Metadata } from "next";
import { PrivacyCenter } from "@/components/app/privacy/PrivacyCenter";
import { getProfileForUser } from "@/lib/profileServer";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Privacy" };

/**
 * `requireUser()` duplicates `app/(app)/layout.tsx`'s own call — same
 * accepted trade-off every `(app)` page since 029 has documented.
 * `getProfileForUser` (must-not-change) already returns `.consents` and
 * `.email` in the exact shape `ConsentsSection`/`AccountDeletionDialog`
 * need, so this page fetches it directly server-side and passes it down
 * as a prop, matching `app/(app)/settings/page.tsx`'s own precedent —
 * simpler than `BillingOverview`'s own separate client-side `/api/me`
 * fetch, since `SettingsPage` already proved this shape works.
 */
export default async function PrivacyCenterPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  return <PrivacyCenter profile={profile} />;
}
