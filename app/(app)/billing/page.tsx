import type { Metadata } from "next";
import { BillingOverview } from "@/components/app/billing/BillingOverview";
import { requireUser, createSupabaseAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Billing" };

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * `requireUser()` duplicates `app/(app)/layout.tsx`'s own call — same
 * accepted trade-off every `(app)` page since 029 has documented.
 *
 * `/api/billing/me` (must-not-change) already exists and works, so —
 * unlike 038/039's "no endpoint exists yet" gaps — `BillingOverview`
 * fetches it client-side on mount itself, the same real-endpoint
 * precedent LEGACY's own page and this workspace's `/import-conversations`
 * and `/assistants` (039) already established. This page's own direct,
 * trusted server-side queries are only for the three "quota summary"
 * *usage* counts instruction #1 asks for — no endpoint anywhere exposes
 * "how much of this month's quota have I used" as its own number, the
 * same class of gap 038 found for active memories and 040 found for
 * draft history. Every query below copies the exact shape the real,
 * must-not-change route that owns each number already uses internally
 * (`app/api/ai/draft-reply/route.ts`'s own monthly-runs count,
 * `app/api/imports/route.ts`'s own monthly-imports count, and 038/039's
 * own active-memories count) — not reinvented, not approximated.
 */
export default async function BillingPage() {
  const user = await requireUser();
  const admin = createSupabaseAdminClient();

  let activeMemoriesUsed = 0;
  let draftsUsedThisMonth = 0;
  let importsUsedThisMonth = 0;
  try {
    const [memoriesResult, draftsResult, importsResult] = await Promise.all([
      admin.from("altr_memories").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true),
      admin.from("altr_assistant_runs").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStartIso()),
      admin.from("altr_conversation_imports").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStartIso()).neq("status", "deleted"),
    ]);
    if (memoriesResult.error) throw memoriesResult.error;
    if (draftsResult.error) throw draftsResult.error;
    if (importsResult.error) throw importsResult.error;
    activeMemoriesUsed = memoriesResult.count ?? 0;
    draftsUsedThisMonth = draftsResult.count ?? 0;
    importsUsedThisMonth = importsResult.count ?? 0;
  } catch {
    // Leave the safe zero defaults — BillingOverview still fetches the
    // real plan/subscription/invoice state independently; this only
    // degrades the quota summary rows, never blocks the page (same
    // degrade-gracefully precedent 036/038/039/040 already set for this
    // identical class of query).
  }

  return (
    <BillingOverview
      activeMemoriesUsed={activeMemoriesUsed}
      draftsUsedThisMonth={draftsUsedThisMonth}
      importsUsedThisMonth={importsUsedThisMonth}
    />
  );
}
