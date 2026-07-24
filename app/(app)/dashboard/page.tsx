import type { Metadata } from "next";
import { DashboardHome } from "@/components/app/DashboardHome";
import { getPlanLimits } from "@/lib/billing/limits";
import { getProfileForUser } from "@/lib/profileServer";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

type ImportStatus = "processing" | "completed" | "failed" | "deleted";

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * `getProfileForUser` (must-not-change) is also called once already in
 * `app/(app)/layout.tsx`, purely for `AppShell`'s name/email/plan — calling
 * it again here duplicates that work (Next's layout/page boundary has no
 * built-in way to pass fetched data down, and neither `lib/profileServer.ts`
 * nor a new shared lib file for a `React.cache()` wrapper is in this
 * prompt's own "files allowed to change" list). Each route segment fetching
 * its own data independently is the standard, idiomatic App Router pattern
 * even with this duplication; flagged here as a real, minor inefficiency
 * for a later performance pass (Prompt 050) rather than silently accepted.
 *
 * "Last import" and "drafts this month" have no existing GET endpoint of
 * their own to call (`/api/imports`'s GET returns the full history, not a
 * single latest row; the draft monthly count is only ever computed inline
 * inside `POST /api/ai/draft-reply`, never exposed via GET) — both queries
 * below reuse the exact same table/columns/`monthStartIso()` logic those
 * two already-existing, must-not-change routes use, run directly since this
 * is itself a trusted server context, not client-side entitlement
 * inference (this prompt's own security requirement).
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const limits = getPlanLimits(profile.plan);
  const admin = createSupabaseAdminClient();

  let lastImport: { status: ImportStatus; platform: string; createdAt: string } | null = null;
  let lastImportError = false;
  try {
    const { data, error } = await admin
      .from("altr_conversation_imports")
      .select("status,platform,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    lastImport = data ? { status: data.status as ImportStatus, platform: data.platform, createdAt: data.created_at } : null;
  } catch {
    lastImportError = true;
  }

  let draftsUsed = 0;
  let draftsError = false;
  try {
    const { count, error } = await admin
      .from("altr_assistant_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStartIso());
    if (error) throw error;
    draftsUsed = count ?? 0;
  } catch {
    draftsError = true;
  }

  return (
    <DashboardHome
      name={profile.name}
      memoryCount={profile.stats.memories}
      memoryLimit={limits.maxActiveMemories}
      draftsUsed={draftsUsed}
      draftsLimit={limits.aiDraftsPerMonth}
      draftsError={draftsError}
      lastImport={lastImport}
      lastImportError={lastImportError}
    />
  );
}
