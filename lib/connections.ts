export const CONNECTION_PROVIDERS = [
  "telegram",
  "gmail",
  "whatsapp",
  "instagram",
  "messenger",
  "slack",
  "discord",
] as const;

export type ConnectionProvider = (typeof CONNECTION_PROVIDERS)[number];
export type ReplyState = "needs_reply" | "draft_ready" | "snoozed" | "up_to_date";

export interface ReplyTrackingMetadata {
  state?: ReplyState;
  updatedAt?: string;
  snoozedUntil?: string | null;
}

export interface ReplyStateInput {
  latestMessage?: { senderType: string; sentAt: string } | null;
  latestDraft?: { completedAt: string } | null;
  tracking?: ReplyTrackingMetadata | null;
  now?: Date;
}

export function isConnectionProvider(value: string | null | undefined): value is ConnectionProvider {
  return CONNECTION_PROVIDERS.includes(value as ConnectionProvider);
}

function timestamp(value: string | null | undefined) {
  const result = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(result) ? result : 0;
}

/**
 * Manual decisions win until a newer message arrives. Drafts are surfaced
 * only when they were created after the latest message, so an old draft can
 * never make a newly-arrived message look handled.
 */
export function resolveReplyState({ latestMessage, latestDraft, tracking, now = new Date() }: ReplyStateInput): ReplyState {
  const messageAt = timestamp(latestMessage?.sentAt);
  const trackingAt = timestamp(tracking?.updatedAt);
  const trackingIsCurrent = trackingAt >= messageAt;

  if (
    tracking?.state === "snoozed"
    && trackingIsCurrent
    && timestamp(tracking.snoozedUntil) > now.getTime()
  ) {
    return "snoozed";
  }

  if (tracking?.state === "up_to_date" && trackingIsCurrent) return "up_to_date";
  if (tracking?.state === "needs_reply" && trackingIsCurrent) return "needs_reply";

  if (latestDraft && timestamp(latestDraft.completedAt) >= messageAt) return "draft_ready";
  if (latestMessage?.senderType === "contact") return "needs_reply";
  return "up_to_date";
}

export function readReplyTracking(metadata: unknown): ReplyTrackingMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const candidate = (metadata as Record<string, unknown>).replyTracking;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const value = candidate as Record<string, unknown>;
  const state = typeof value.state === "string" && ["needs_reply", "draft_ready", "snoozed", "up_to_date"].includes(value.state)
    ? value.state as ReplyState
    : undefined;
  return {
    state,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    snoozedUntil: typeof value.snoozedUntil === "string" ? value.snoozedUntil : null,
  };
}
