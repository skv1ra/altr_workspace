import { NextRequest, NextResponse } from "next/server";
import { assertAuthRateLimit, getRequestIdentity } from "@/lib/auth/rate-limit";
import { syncGmailConnection, type GmailConnectionRow } from "@/lib/integrations/gmail-sync";
import { createSupabaseAdminClient, requireUser } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    await assertAuthRateLimit("gmail_sync", getRequestIdentity(request, user.id));
    const admin = createSupabaseAdminClient();
    const connection = await admin.from("altr_data_connections")
      .select("id,user_id,external_account_id,display_name,metadata")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .eq("status", "connected")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (connection.error) throw connection.error;
    if (!connection.data) return NextResponse.json({ error: "GMAIL_NOT_CONNECTED" }, { status: 409 });
    const result = await syncGmailConnection(connection.data as GmailConnectionRow);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED"
      ? 401
      : error instanceof Error && error.message === "RATE_LIMITED"
        ? 429
        : 500;
    return NextResponse.json({
      error: status === 401 ? "AUTH_REQUIRED" : status === 429 ? "RATE_LIMITED" : "GMAIL_SYNC_FAILED",
    }, { status });
  }
}
