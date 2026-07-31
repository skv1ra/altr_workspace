import { NextRequest, NextResponse } from "next/server";
import { assertAuthRateLimit, getRequestIdentity } from "@/lib/auth/rate-limit";
import { isConnectionProvider, readReplyTracking, resolveReplyState } from "@/lib/connections";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

type MessageRow = {
  id: string;
  sender_type: string;
  sender_label: string | null;
  content: string;
  sent_at: string;
};

type DraftRow = {
  id: string;
  conversation_id: string;
  output_text: string;
  completed_at: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await assertAuthRateLimit("connections_read", getRequestIdentity(request, user.id));
    const providerParam = request.nextUrl.searchParams.get("provider");
    if (providerParam && !isConnectionProvider(providerParam)) {
      return NextResponse.json({ error: "INVALID_CONNECTION_PROVIDER" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    let query = admin
      .from("altr_conversations")
      .select("id,platform,title,participant_summary,last_message_at,metadata,altr_messages(id,sender_type,sender_label,content,sent_at)")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("sent_at", { referencedTable: "altr_messages", ascending: false })
      .limit(1, { referencedTable: "altr_messages" })
      .limit(100);
    if (providerParam) query = query.eq("platform", providerParam);
    const conversationsResult = await query;
    if (conversationsResult.error) throw conversationsResult.error;

    const conversations = conversationsResult.data ?? [];
    const ids = conversations.map((conversation) => conversation.id);
    const draftsResult = ids.length
      ? await admin
        .from("altr_assistant_runs")
        .select("id,conversation_id,output_text,completed_at")
        .eq("user_id", user.id)
        .in("conversation_id", ids)
        .eq("status", "draft")
        .order("completed_at", { ascending: false })
        .limit(250)
      : { data: [] as DraftRow[], error: null };
    if (draftsResult.error) throw draftsResult.error;

    const latestDraftByConversation = new Map<string, DraftRow>();
    for (const draft of (draftsResult.data ?? []) as DraftRow[]) {
      if (!latestDraftByConversation.has(draft.conversation_id)) {
        latestDraftByConversation.set(draft.conversation_id, draft);
      }
    }

    const items = conversations.map((conversation) => {
      const latestMessage = ((conversation.altr_messages ?? []) as MessageRow[])[0] ?? null;
      const latestDraft = latestDraftByConversation.get(conversation.id) ?? null;
      const state = resolveReplyState({
        latestMessage: latestMessage ? { senderType: latestMessage.sender_type, sentAt: latestMessage.sent_at } : null,
        latestDraft: latestDraft?.completed_at ? { completedAt: latestDraft.completed_at } : null,
        tracking: readReplyTracking(conversation.metadata),
      });
      const participants = Array.isArray(conversation.participant_summary)
        ? conversation.participant_summary.filter((value): value is string => typeof value === "string").slice(0, 4)
        : [];
      return {
        id: conversation.id,
        platform: conversation.platform,
        title: conversation.title || latestMessage?.sender_label || "Conversation",
        participants,
        lastMessageAt: conversation.last_message_at ?? latestMessage?.sent_at ?? null,
        latestMessage: latestMessage ? {
          id: latestMessage.id,
          senderType: latestMessage.sender_type,
          senderLabel: latestMessage.sender_label,
          content: latestMessage.content,
          sentAt: latestMessage.sent_at,
        } : null,
        latestDraft: latestDraft ? {
          id: latestDraft.id,
          content: latestDraft.output_text,
          completedAt: latestDraft.completed_at,
        } : null,
        state,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED"
      ? 401
      : error instanceof Error && error.message === "RATE_LIMITED"
        ? 429
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "AUTH_REQUIRED" : status === 429 ? "RATE_LIMITED" : "CONNECTION_INBOX_FAILED" },
      { status },
    );
  }
}
