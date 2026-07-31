import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAuthRateLimit, getRequestIdentity } from "@/lib/auth/rate-limit";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const updateSchema = z.object({
  state: z.enum(["needs_reply", "snoozed", "up_to_date"]),
  snoozedUntil: z.string().datetime().nullable().optional(),
}).strict().superRefine((value, context) => {
  if (value.state === "snoozed" && !value.snoozedUntil) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "SNOOZE_TIME_REQUIRED", path: ["snoozedUntil"] });
  }
  if (value.snoozedUntil && Date.parse(value.snoozedUntil) > Date.now() + 90 * 24 * 60 * 60 * 1000) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "SNOOZE_TIME_TOO_FAR", path: ["snoozedUntil"] });
  }
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertAuthRateLimit("conversation_write", getRequestIdentity(request, user.id));
    const id = idSchema.parse(params.id);
    const input = updateSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    const existing = await admin
      .from("altr_conversations")
      .select("id,metadata")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return NextResponse.json({ error: "CONVERSATION_NOT_FOUND" }, { status: 404 });

    const now = new Date().toISOString();
    const metadata = existing.data.metadata && typeof existing.data.metadata === "object" && !Array.isArray(existing.data.metadata)
      ? existing.data.metadata as Record<string, unknown>
      : {};
    const replyTracking = {
      state: input.state,
      updatedAt: now,
      snoozedUntil: input.state === "snoozed" ? input.snoozedUntil : null,
    };
    const updated = await admin
      .from("altr_conversations")
      .update({ metadata: { ...metadata, replyTracking } })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data) return NextResponse.json({ error: "CONVERSATION_NOT_FOUND" }, { status: 404 });

    await admin.from("altr_audit_events").insert({
      user_id: user.id,
      actor_type: "user",
      event_type: "conversation.reply_state_updated",
      entity_type: "conversation",
      entity_id: id,
      metadata: { state: input.state, snoozed_until: replyTracking.snoozedUntil },
    });

    return NextResponse.json({ conversationId: id, replyTracking });
  } catch (error) {
    const status = error instanceof z.ZodError
      ? 400
      : error instanceof Error && error.message === "AUTH_REQUIRED"
        ? 401
        : error instanceof Error && error.message === "RATE_LIMITED"
          ? 429
          : 500;
    return NextResponse.json(
      { error: status === 400 ? "INVALID_REPLY_STATE" : status === 401 ? "AUTH_REQUIRED" : status === 429 ? "RATE_LIMITED" : "REPLY_STATE_UPDATE_FAILED" },
      { status },
    );
  }
}
