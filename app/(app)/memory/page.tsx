import type { Metadata } from "next";
import { MemoryOverview } from "@/components/app/memory/MemoryOverview";
import { getPlanLimits } from "@/lib/billing/limits";
import { getProfileForUser } from "@/lib/profileServer";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Memory" };

/**
 * Same duplication trade-off `app/(app)/dashboard/page.tsx` (029) already
 * documented and accepted: `getProfileForUser` runs once more here on top
 * of `app/(app)/layout.tsx`'s own call, since Next's layout/page boundary
 * has no built-in way to pass fetched data down and `lib/` is outside this
 * prompt's own file scope. The category/active-count queries below are
 * direct, trusted server-side reads — same "no existing GET endpoint
 * covers this, reuse the same table/columns a must-not-change route
 * already relies on" precedent 029 set for its own "last import"/"drafts"
 * numbers (`GET /api/memories` has no "distinct categories" or "active-
 * only count" shape of its own).
 */
export default async function MemoryPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const limits = getPlanLimits(profile.plan);
  const admin = createSupabaseAdminClient();

  let activeMemoryCount = 0;
  let categoryCounts: Array<{ category: string; count: number }> = [];
  let totalMemories = 0;
  try {
    const [activeResult, categoryRowsResult] = await Promise.all([
      admin.from("altr_memories").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true),
      admin.from("altr_memories").select("category").eq("user_id", user.id),
    ]);
    if (activeResult.error) throw activeResult.error;
    if (categoryRowsResult.error) throw categoryRowsResult.error;
    activeMemoryCount = activeResult.count ?? 0;
    const rows = categoryRowsResult.data ?? [];
    totalMemories = rows.length;
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    categoryCounts = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, count]) => ({ category, count }));
  } catch {
    // Leave the safe zero/empty defaults — `MemoryOverview` still fetches
    // its own paginated list independently, so this only degrades the
    // header stats/tabs, never blocks the page.
  }

  return (
    <MemoryOverview
      initialQuery={typeof searchParams.q === "string" ? searchParams.q : ""}
      initialCategory={typeof searchParams.category === "string" ? searchParams.category : ""}
      initialPage={Math.max(1, Number(searchParams.page) || 1)}
      categoryCounts={categoryCounts}
      totalMemories={totalMemories}
      activeMemoryCount={activeMemoryCount}
      memoryLimit={limits.maxActiveMemories}
      learningEnabled={profile.preferences.learning}
      connections={profile.connections}
      preferences={profile.preferences}
    />
  );
}
