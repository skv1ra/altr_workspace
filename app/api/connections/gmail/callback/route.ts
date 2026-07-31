import { NextRequest, NextResponse } from "next/server";
import {
  decryptGmailTokens,
  encryptGmailTokens,
  exchangeGmailCode,
  getGmailProfile,
  gmailStateMatches,
  type GmailTokenBundle,
} from "@/lib/integrations/gmail";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

const COOKIE_PATH = "/api/connections/gmail";

function redirect(request: NextRequest, result: string) {
  const response = NextResponse.redirect(new URL(`/connections?gmail=${result}`, request.nextUrl.origin));
  response.cookies.set("altr_gmail_oauth_state", "", { path: COOKIE_PATH, maxAge: 0 });
  response.cookies.set("altr_gmail_oauth_verifier", "", { path: COOKIE_PATH, maxAge: 0 });
  return response;
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function GET(request: NextRequest) {
  try {
    const error = request.nextUrl.searchParams.get("error");
    if (error) return redirect(request, error === "access_denied" ? "cancelled" : "error");
    const state = request.nextUrl.searchParams.get("state");
    const code = request.nextUrl.searchParams.get("code");
    const expectedState = request.cookies.get("altr_gmail_oauth_state")?.value;
    const verifier = request.cookies.get("altr_gmail_oauth_verifier")?.value;
    if (!code || !verifier || !gmailStateMatches(expectedState, state)) return redirect(request, "invalid_state");

    const user = await requireUser();
    const admin = createSupabaseAdminClient();
    const consent = await admin.from("altr_consents")
      .select("conversation_processing_accepted_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (consent.error) throw consent.error;
    if (!consent.data?.conversation_processing_accepted_at) return redirect(request, "consent_required");

    const token = await exchangeGmailCode(code, verifier);
    const profile = await getGmailProfile(token.access_token);
    const accountEmail = profile.emailAddress.toLowerCase();
    const existing = await admin.from("altr_data_connections")
      .select("id,metadata")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .eq("external_account_id", accountEmail)
      .maybeSingle();
    if (existing.error) throw existing.error;
    const oldMetadata = metadataRecord(existing.data?.metadata);
    let refreshToken = token.refresh_token;
    if (!refreshToken && oldMetadata.oauth) {
      try {
        refreshToken = decryptGmailTokens(oldMetadata.oauth).refreshToken;
      } catch {
        refreshToken = undefined;
      }
    }
    if (!refreshToken) throw new Error("GMAIL_REFRESH_TOKEN_MISSING");

    const scopes = token.scope?.split(" ").filter(Boolean) ?? ["https://www.googleapis.com/auth/gmail.readonly"];
    const bundle: GmailTokenBundle = {
      accessToken: token.access_token,
      refreshToken,
      expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
      scope: scopes,
    };
    const now = new Date().toISOString();
    const connection = await admin.from("altr_data_connections").upsert({
      user_id: user.id,
      provider: "gmail",
      external_account_id: accountEmail,
      display_name: profile.emailAddress,
      status: "connected",
      scopes,
      metadata: {
        ...oldMetadata,
        oauth: encryptGmailTokens(bundle),
        gmail: { historyId: profile.historyId ?? null },
      },
      connected_at: now,
    }, { onConflict: "user_id,provider,external_account_id" }).select("id").single();
    if (connection.error) throw connection.error;

    await admin.from("altr_audit_events").insert({
      user_id: user.id,
      actor_type: "user",
      event_type: "connection.gmail_connected",
      entity_type: "data_connection",
      entity_id: connection.data.id,
      metadata: { account: accountEmail },
    });
    return redirect(request, "connected");
  } catch {
    return redirect(request, "error");
  }
}
