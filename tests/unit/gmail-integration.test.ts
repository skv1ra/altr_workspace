// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));

import {
  createGmailPkce,
  decryptGmailTokens,
  encryptGmailTokens,
  gmailAuthorizationUrl,
  gmailStateMatches,
} from "@/lib/integrations/gmail";
import { normalizeGmailThread } from "@/lib/integrations/gmail-sync";

beforeEach(() => {
  process.env.GMAIL_OAUTH_CLIENT_ID = "client-id-for-tests.apps.googleusercontent.com";
  process.env.GMAIL_OAUTH_CLIENT_SECRET = "client-secret-for-tests-123456";
  process.env.GMAIL_OAUTH_REDIRECT_URI = "https://altr.example/api/connections/gmail/callback";
  process.env.GMAIL_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("Gmail OAuth security", () => {
  it("requests read-only Gmail access with offline refresh and PKCE", async () => {
    const pkce = createGmailPkce();
    const url = await gmailAuthorizationUrl("state-123", pkce.challenge);

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("scope")).toContain("https://www.googleapis.com/auth/gmail.readonly");
    expect(url.searchParams.get("scope")).not.toContain("gmail.send");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("redirect_uri")).toBe("https://altr.example/api/connections/gmail/callback");
  });

  it("encrypts provider tokens with authenticated encryption before persistence", async () => {
    const value = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: 123456789,
      scope: ["gmail.readonly"],
    };
    const encrypted = await encryptGmailTokens(value);

    expect(encrypted.ciphertext).not.toContain("refresh-token");
    expect(await decryptGmailTokens(encrypted)).toEqual(value);
    expect(gmailStateMatches("same-state", "same-state")).toBe(true);
    expect(gmailStateMatches("same-state", "other-state")).toBe(false);
  });
});

describe("Gmail normalization", () => {
  it("turns a recent Gmail thread into a reply-queue conversation", () => {
    const body = Buffer.from("Can we meet tomorrow?", "utf8").toString("base64url");
    const conversation = normalizeGmailThread({
      id: "thread-1",
      messages: [{
        id: "message-1",
        threadId: "thread-1",
        internalDate: String(Date.parse("2026-07-31T10:00:00.000Z")),
        labelIds: ["INBOX"],
        snippet: "Can we meet tomorrow?",
        payload: {
          mimeType: "text/plain",
          body: { data: body },
          headers: [
            { name: "From", value: "Anna <anna@example.com>" },
            { name: "To", value: "Max <max@example.com>" },
            { name: "Subject", value: "Tomorrow" },
          ],
        },
      }],
    }, "max@example.com");

    expect(conversation).toMatchObject({
      externalConversationId: "thread-1",
      title: "Tomorrow",
      lastMessageAt: "2026-07-31T10:00:00.000Z",
    });
    expect(conversation.messages[0]).toMatchObject({
      externalMessageId: "message-1",
      senderType: "contact",
      content: "Can we meet tomorrow?",
    });
  });
});
