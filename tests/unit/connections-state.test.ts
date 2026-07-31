import { describe, expect, it } from "vitest";
import { readReplyTracking, resolveReplyState } from "@/lib/connections";

describe("connection reply-state resolution", () => {
  const now = new Date("2026-07-31T12:00:00.000Z");

  it("flags the latest incoming contact message as needing a reply", () => {
    expect(resolveReplyState({
      latestMessage: { senderType: "contact", sentAt: "2026-07-31T10:00:00.000Z" },
      now,
    })).toBe("needs_reply");
  });

  it("surfaces a draft only when it is newer than the incoming message", () => {
    expect(resolveReplyState({
      latestMessage: { senderType: "contact", sentAt: "2026-07-31T10:00:00.000Z" },
      latestDraft: { completedAt: "2026-07-31T10:01:00.000Z" },
      now,
    })).toBe("draft_ready");

    expect(resolveReplyState({
      latestMessage: { senderType: "contact", sentAt: "2026-07-31T10:00:00.000Z" },
      latestDraft: { completedAt: "2026-07-31T09:59:00.000Z" },
      now,
    })).toBe("needs_reply");
  });

  it("keeps a handled state only until a newer incoming message arrives", () => {
    expect(resolveReplyState({
      latestMessage: { senderType: "contact", sentAt: "2026-07-31T10:00:00.000Z" },
      tracking: { state: "up_to_date", updatedAt: "2026-07-31T10:05:00.000Z" },
      now,
    })).toBe("up_to_date");

    expect(resolveReplyState({
      latestMessage: { senderType: "contact", sentAt: "2026-07-31T10:10:00.000Z" },
      tracking: { state: "up_to_date", updatedAt: "2026-07-31T10:05:00.000Z" },
      now,
    })).toBe("needs_reply");
  });

  it("expires snoozes and safely ignores malformed metadata", () => {
    expect(resolveReplyState({
      latestMessage: { senderType: "contact", sentAt: "2026-07-31T10:00:00.000Z" },
      tracking: { state: "snoozed", updatedAt: "2026-07-31T10:05:00.000Z", snoozedUntil: "2026-08-01T10:05:00.000Z" },
      now,
    })).toBe("snoozed");
    expect(resolveReplyState({
      latestMessage: { senderType: "contact", sentAt: "2026-07-31T10:00:00.000Z" },
      tracking: { state: "snoozed", updatedAt: "2026-07-31T10:05:00.000Z", snoozedUntil: "2026-07-31T11:00:00.000Z" },
      now,
    })).toBe("needs_reply");
    expect(readReplyTracking({ replyTracking: "ignore me" })).toBeNull();
  });
});
