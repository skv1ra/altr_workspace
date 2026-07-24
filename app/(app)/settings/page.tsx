import type { Metadata } from "next";
import { SettingsView } from "@/components/app/settings/SettingsView";
import { getProfileForUser } from "@/lib/profileServer";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  return <SettingsView profile={profile} />;
}
