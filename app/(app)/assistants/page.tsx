import type { Metadata } from "next";
import { TwinConfigView } from "@/components/app/twin/TwinConfigView";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Twin" };

/**
 * `requireUser()` here duplicates `app/(app)/layout.tsx`'s own call — same
 * accepted trade-off `app/(app)/dashboard/page.tsx` (029) and
 * `app/(app)/memory/page.tsx` (036) already documented: Next has no
 * built-in way to pass a layout's already-fetched session down to a page.
 *
 * The Twin row and roadmap previews themselves are deliberately NOT
 * fetched here — `TwinConfigView` fetches `GET /api/assistants` client-
 * side on mount instead, mirroring both LEGACY's own real `/assistants`
 * page (a plain client-fetch, no server-side data loading at all) and this
 * workspace's own `/import-conversations` (032, "no server-side data fetch
 * of its own... all data comes from the client-side GET"). Only the
 * active-memory count needs a direct, trusted server-side query — `GET
 * /api/memories` (must-not-change) has no active-only count of its own,
 * same gap Prompt 038 already found and worked around for the memory
 * page's own header meter.
 */
export default async function AssistantsPage() {
  const user = await requireUser();
  const admin = createSupabaseAdminClient();

  let activeMemoryCount = 0;
  try {
    const { error, count } = await admin
      .from("altr_memories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);
    if (error) throw error;
    activeMemoryCount = count ?? 0;
  } catch {
    // Leave the safe zero default — TwinConfigView still fetches the real
    // Twin config independently; this only degrades the memory-linkage
    // summary, never blocks the page (same degrade-gracefully precedent
    // `app/(app)/memory/page.tsx` already set for this identical query).
  }

  return <TwinConfigView activeMemoryCount={activeMemoryCount} />;
}
