import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  // Prompt 031 — new users land here once (instruction #2); already-
  // onboarded users never see it, including on a direct re-visit to
  // /onboarding itself (that page's own redirect handles that direction).
  if (!profile.onboardingCompleted) redirect("/onboarding");
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

  // Same monthly-imports-count shape `app/(app)/billing/page.tsx` (043)
  // already queries directly for its own quota row — no GET endpoint
  // exposes this as its own number either, same class of gap 029/038/039
  // already found and worked around.
  let importsUsed = 0;
  let importsError = false;
  try {
    const { count, error } = await admin
      .from("altr_conversation_imports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStartIso())
      .neq("status", "deleted");
    if (error) throw error;
    importsUsed = count ?? 0;
  } catch {
    importsError = true;
  }

  // "Recently learned" — the same real fields `MemoryRow` already renders
  // (title/category/confidence), just the newest few, active only. No
  // endpoint of its own exists (`GET /api/memories` returns the full,
  // paginated list, not a "recent N" shape) so this reuses the same
  // direct, trusted server-side read every other row on this page already
  // does, with the same safe-empty-on-error degrade.
  let recentMemories: Array<{ id: string; title: string; category: string; confidence: number }> = [];
  try {
    const { data, error } = await admin
      .from("altr_memories")
      .select("id,title,category,confidence")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(4);
    if (error) throw error;
    recentMemories = data ?? [];
  } catch {
    // Leave the safe empty default — degrades to "nothing learned yet"
    // copy rather than blocking the page, same precedent as every other
    // query on this page.
  }

  return (
    <DashboardHome
      name={profile.name}
      plan={profile.plan}
      memoryCount={profile.stats.memories}
      memoryLimit={limits.maxActiveMemories}
      draftsUsed={draftsUsed}
      draftsLimit={limits.aiDraftsPerMonth}
      draftsError={draftsError}
      importsUsed={importsUsed}
      importsLimit={limits.importsPerMonth}
      importsError={importsError}
      lastImport={lastImport}
      lastImportError={lastImportError}
      recentMemories={recentMemories}
    />
  );
}
