import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/app/onboarding/OnboardingFlow";
import { getProfileForUser } from "@/lib/profileServer";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Welcome" };

/** Edge case: a user who already finished (or skipped) onboarding revisiting
 *  this URL directly is sent straight back to the dashboard, never shown
 *  the flow a second time (this prompt's own "shown once" requirement). */
export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  if (profile.onboardingCompleted) redirect("/dashboard");

  return <OnboardingFlow initialAltrName={profile.altrName} initialTone={profile.tone} />;
}
