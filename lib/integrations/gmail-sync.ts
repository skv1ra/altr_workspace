import "server-only";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { gmailAccessToken } from "@/lib/integrations/gmail";

type GmailHeader = { name?: string; value?: string };
type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };
type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  internalDate?: string;
  snippet?: string;
  payload?: GmailPart & { headers?: GmailHeader[] };
};
type GmailThread = { id: string; historyId?: string; messages?: GmailMessage[] };

export type GmailConnectionRow = {
  id: string;
  user_id: string;
  external_account_id: string | null;
  display_name: string | null;
  metadata: unknown;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function header(message: GmailMessage, name: string) {
  return message.payload?.headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function emailAddress(value: string) {
  return value.match(/<([^>]+)>/)?.[1]?.trim().toLowerCase() ?? value.trim().toLowerCase();
}

function decodeBody(data: string) {
  try {
    return Buffer.from(data, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function plainText(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) return decodeBody(part.body.data);
  for (const child of part.parts ?? []) {
    const text = plainText(child);
    if (text) return text;
  }
  return "";
}

function cleanContent(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 6_000);
}

function messageTimestamp(message: GmailMessage) {
  const internalDate = Number(message.internalDate);
  if (Number.isFinite(internalDate) && internalDate > 0) return new Date(internalDate).toISOString();
  const headerDate = Date.parse(header(message, "Date"));
  return new Date(Number.isFinite(headerDate) ? headerDate : Date.now()).toISOString();
}

export function normalizeGmailThread(thread: GmailThread, accountEmail: string) {
  const messages = (thread.messages ?? []).slice(-12).map((message) => {
    const from = header(message, "From");
    const fromEmail = emailAddress(from);
    const sentAt = messageTimestamp(message);
    return {
      externalMessageId: message.id,
      senderType: fromEmail === accountEmail.toLowerCase() ? "user" as const : "contact" as const,
      senderLabel: from || fromEmail || "Contact",
      content: cleanContent(plainText(message.payload) || message.snippet || "(No text content)"),
      sentAt,
      metadata: { gmail_thread_id: thread.id, labels: message.labelIds ?? [] },
    };
  });
  const latest = messages.at(-1);
  const source = (thread.messages ?? []).at(-1);
  const subject = source ? header(source, "Subject").trim() : "";
  const participants = [...new Set((thread.messages ?? []).flatMap((message) => [header(message, "From"), header(message, "To")]).filter(Boolean))].slice(0, 8);
  return {
    externalConversationId: thread.id,
    title: subject || latest?.senderLabel || "Gmail conversation",
    participantSummary: participants,
    startedAt: messages[0]?.sentAt ?? null,
    lastMessageAt: latest?.sentAt ?? null,
    messages,
  };
}

async function gmailJson<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(response.status === 401 ? "GMAIL_TOKEN_REJECTED" : "GMAIL_API_FAILED");
  return response.json() as Promise<T>;
}

async function fetchRecentThreads(accessToken: string) {
  const list = await gmailJson<{ threads?: Array<{ id: string }> }>(
    "threads?maxResults=25&q=newer_than%3A90d%20-in%3Aspam%20-in%3Atrash",
    accessToken,
  );
  const ids = (list.threads ?? []).map((thread) => thread.id);
  const result: GmailThread[] = [];
  for (let index = 0; index < ids.length; index += 5) {
    const batch = await Promise.all(ids.slice(index, index + 5).map((id) =>
      gmailJson<GmailThread>(`threads/${encodeURIComponent(id)}?format=full`, accessToken),
    ));
    result.push(...batch);
  }
  return result;
}

export async function syncGmailConnection(connection: GmailConnectionRow) {
  const metadata = record(connection.metadata);
  const oauth = await gmailAccessToken(metadata.oauth);
  const accountEmail = connection.external_account_id;
  if (!accountEmail) throw new Error("GMAIL_ACCOUNT_MISSING");
  const normalized = (await fetchRecentThreads(oauth.accessToken))
    .map((thread) => normalizeGmailThread(thread, accountEmail))
    .filter((thread) => thread.messages.length > 0);

  const admin = createSupabaseAdminClient();
  const conversationRows = normalized.map((thread) => ({
    user_id: connection.user_id,
    data_connection_id: connection.id,
    external_conversation_id: thread.externalConversationId,
    platform: "gmail",
    title: thread.title,
    participant_summary: thread.participantSummary,
    started_at: thread.startedAt,
    last_message_at: thread.lastMessageAt,
    metadata: { source: "gmail_oauth", synced_at: new Date().toISOString() },
  }));
  const saved = conversationRows.length
    ? await admin.from("altr_conversations").upsert(conversationRows, {
      onConflict: "data_connection_id,external_conversation_id",
    }).select("id,external_conversation_id")
    : { data: [], error: null };
  if (saved.error) throw saved.error;

  const conversationIds = new Map((saved.data ?? []).map((row) => [row.external_conversation_id, row.id]));
  const messageRows = normalized.flatMap((thread) => {
    const conversationId = conversationIds.get(thread.externalConversationId);
    if (!conversationId) return [];
    return thread.messages.map((message) => ({
      user_id: connection.user_id,
      conversation_id: conversationId,
      external_message_id: message.externalMessageId,
      sender_type: message.senderType,
      sender_label: message.senderLabel,
      content: message.content,
      sent_at: message.sentAt,
      metadata: message.metadata,
    }));
  });
  if (messageRows.length) {
    const result = await admin.from("altr_messages").upsert(messageRows, {
      onConflict: "conversation_id,external_message_id",
    });
    if (result.error) throw result.error;
  }

  const now = new Date().toISOString();
  const nextMetadata = {
    ...metadata,
    oauth: oauth.encrypted,
    sync: { conversations: normalized.length, messages: messageRows.length, syncedAt: now },
  };
  const updated = await admin.from("altr_data_connections").update({
    metadata: nextMetadata,
    status: "connected",
    last_synced_at: now,
  }).eq("id", connection.id).eq("user_id", connection.user_id);
  if (updated.error) throw updated.error;

  await admin.from("altr_audit_events").insert({
    user_id: connection.user_id,
    actor_type: "user",
    event_type: "connection.gmail_synced",
    entity_type: "data_connection",
    entity_id: connection.id,
    metadata: { conversations: normalized.length, messages: messageRows.length },
  });
  return { conversations: normalized.length, messages: messageRows.length, syncedAt: now };
}

export const gmailSyncResultSchema = z.object({
  conversations: z.number().int().nonnegative(),
  messages: z.number().int().nonnegative(),
  syncedAt: z.string().datetime(),
});
