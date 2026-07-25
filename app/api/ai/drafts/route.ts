import { NextRequest, NextResponse } from "next/server";
import { assertAuthRateLimit, getRequestIdentity } from "@/lib/auth/rate-limit";
import { requireUser, createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Prompt 040's own "history parity gap" endpoint — `altr_assistant_runs`
 * had no list route anywhere in this workspace before this file (only
 * `POST /api/ai/draft-reply`, which inserts a row, and `POST /api/ai/
 * drafts/:id/feedback`, which reads exactly one row by id). Follows the
 * sibling `GET /api/memories` (`app/api/memories/route.ts`, must-not-
 * change, read only) pagination shape (`page`/`pageSize`/`total`/
 * `totalPages`) exactly, and this prompt's own explicit instruction to
 * rate-limit it — a deliberate deviation from `GET /api/memories`'/`GET
 * /api/imports`'s own actual convention of never rate-limiting a plain
 * list GET (verified by reading both before writing this route); adding a
 * limit here is strictly more conservative, never less secure, and the
 * prompt's own file-scope note for this route says so explicitly.
 *
 * Selected columns are deliberately narrow: no `usage` (raw token/cost
 * internals — this prompt's own security requirement), no
 * `assistant_config_id`/`conversation_id` foreign keys (internal only,
 * nothing in this prompt's UI needs them). `request_metadata` is safe —
 * it only ever holds the requester's own submitted tone/length/language/
 * contact strings, never anything from the model's own response.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await assertAuthRateLimit("ai_drafts_list", getRequestIdentity(request, user.id));
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
    const from = (page - 1) * pageSize;

    const { data, error, count } = await createSupabaseAdminClient()
      .from("altr_assistant_runs")
      .select(
        "id,input_text,output_text,model,status,used_memory_ids,used_message_ids,used_conversation_ids,request_metadata,created_at,completed_at",
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;

    return NextResponse.json({
      runs: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "RATE_LIMITED" ? 429 : error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DRAFT_HISTORY_LIST_FAILED" },
      { status },
    );
  }
}
