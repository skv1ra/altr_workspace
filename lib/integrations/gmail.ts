import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import { getAppUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const configSchema = z.object({
  clientId: z.string().min(20),
  clientSecret: z.string().min(20),
  redirectUri: z.string().url(),
  encryptionKey: z.string().min(40),
});

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive().optional(),
  refresh_token: z.string().min(1).optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});

const profileSchema = z.object({
  emailAddress: z.string().email(),
  messagesTotal: z.number().optional(),
  threadsTotal: z.number().optional(),
  historyId: z.string().optional(),
});

export type GmailTokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string[];
};

export type EncryptedGmailTokens = {
  version: 1;
  iv: string;
  tag: string;
  ciphertext: string;
};

type GmailConfig = z.infer<typeof configSchema>;
let configPromise: Promise<GmailConfig> | null = null;

async function loadGmailConfig(): Promise<GmailConfig> {
  const fromEnvironment = configSchema.safeParse({
    clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
    clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_OAUTH_REDIRECT_URI ?? `${getAppUrl()}/api/connections/gmail/callback`,
    encryptionKey: process.env.GMAIL_TOKEN_ENCRYPTION_KEY,
  });
  if (fromEnvironment.success) return fromEnvironment.data;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("altr_gmail_oauth_config");
  if (error) throw new Error("GMAIL_CONFIG_UNAVAILABLE");
  return configSchema.parse(data);
}

export function getGmailConfig() {
  configPromise ??= loadGmailConfig();
  return configPromise;
}

function encryptionKey(config: GmailConfig) {
  const raw = config.encryptionKey;
  const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("GMAIL_ENCRYPTION_KEY_INVALID");
  return key;
}

export async function encryptGmailTokens(tokens: GmailTokenBundle): Promise<EncryptedGmailTokens> {
  const config = await getGmailConfig();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(config), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(tokens), "utf8"), cipher.final()]);
  return {
    version: 1,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

export async function decryptGmailTokens(value: unknown): Promise<GmailTokenBundle> {
  const config = await getGmailConfig();
  const encrypted = z.object({
    version: z.literal(1),
    iv: z.string().min(1),
    tag: z.string().min(1),
    ciphertext: z.string().min(1),
  }).parse(value);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(config), Buffer.from(encrypted.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  return z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresAt: z.number(),
    scope: z.array(z.string()),
  }).parse(JSON.parse(plaintext));
}

export function createGmailPkce() {
  const verifier = randomBytes(48).toString("base64url");
  return {
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
}

export function createGmailState() {
  return randomBytes(32).toString("base64url");
}

export function gmailStateMatches(expected: string | undefined, received: string | null) {
  if (!expected || !received) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function gmailAuthorizationUrl(state: string, challenge: string) {
  const config = await getGmailConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
    ].join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return url;
}

async function requestTokens(parameters: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: parameters,
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("GMAIL_TOKEN_EXCHANGE_FAILED");
  return tokenResponseSchema.parse(body);
}

export async function exchangeGmailCode(code: string, verifier: string) {
  const config = await getGmailConfig();
  const token = await requestTokens(new URLSearchParams({
    code,
    code_verifier: verifier,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  }));
  return token;
}

export async function refreshGmailTokens(tokens: GmailTokenBundle): Promise<GmailTokenBundle> {
  const config = await getGmailConfig();
  const token = await requestTokens(new URLSearchParams({
    refresh_token: tokens.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  }));
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    scope: token.scope?.split(" ").filter(Boolean) ?? tokens.scope,
  };
}

export async function gmailAccessToken(encrypted: unknown) {
  let tokens = await decryptGmailTokens(encrypted);
  if (tokens.expiresAt <= Date.now() + 60_000) tokens = await refreshGmailTokens(tokens);
  return { accessToken: tokens.accessToken, tokens, encrypted: await encryptGmailTokens(tokens) };
}

export async function getGmailProfile(accessToken: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("GMAIL_PROFILE_FAILED");
  return profileSchema.parse(await response.json());
}

export async function revokeGmailToken(token: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store",
  }).catch(() => undefined);
}
