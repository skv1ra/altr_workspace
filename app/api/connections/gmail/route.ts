import { NextRequest, NextResponse } from "next/server";
import { assertAuthRateLimit, getRequestIdentity } from "@/lib/auth/rate-limit";
import { decryptGmailTokens, revokeGmailToken } from "@/lib/integrations/gmail";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    await assertAuthRateLimit("connection_write", getRequestIdentity(request, user.id));
    const admin = createSupabaseAdminClient();
    const connection = await admin.from("altr_data_connections")
      .select("id,metadata")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .eq("status", "connected")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (connection.error) throw connection.error;
    if (!connection.data) return NextResponse.json({ error: "GMAIL_NOT_CONNECTED" }, { status: 404 });

    const metadata = record(connection.data.metadata);
    if (metadata.oauth) {
      try {
        const tokens = await decryptGmailTokens(metadata.oauth);
        await revokeGmailToken(tokens.refreshToken || tokens.accessToken);
      } catch {
        // The local connection is still revoked even if Google already invalidated the token.
      }
    }
    const { oauth: _oauth, ...safeMetadata } = metadata;
    const update = await admin.from("altr_data_connections").update({
      status: "revoked",
      scopes: [],
      metadata: safeMetadata,
    }).eq("id", connection.data.id).eq("user_id", user.id);
    if (update.error) throw update.error;
    await admin.from("altr_audit_events").insert({
      user_id: user.id,
      actor_type: "user",
      event_type: "connection.gmail_disconnected",
      entity_type: "data_connection",
      entity_id: connection.data.id,
      metadata: {},
    });
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED"
      ? 401
      : error instanceof Error && error.message === "RATE_LIMITED"
        ? 429
        : 500;
    return NextResponse.json({ error: status === 401 ? "AUTH_REQUIRED" : status === 429 ? "RATE_LIMITED" : "GMAIL_DISCONNECT_FAILED" }, { status });
  }
}
