import { NextRequest, NextResponse } from "next/server";
import { assertAuthRateLimit, getRequestIdentity } from "@/lib/auth/rate-limit";
import { createGmailPkce, createGmailState, gmailAuthorizationUrl } from "@/lib/integrations/gmail";
import { requireUser } from "@/lib/supabase/server";

const COOKIE_PATH = "/api/connections/gmail";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await assertAuthRateLimit("connection_write", getRequestIdentity(request, user.id));
    const state = createGmailState();
    const pkce = createGmailPkce();
    const response = NextResponse.redirect(gmailAuthorizationUrl(state, pkce.challenge));
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: COOKIE_PATH,
      maxAge: 10 * 60,
    };
    response.cookies.set("altr_gmail_oauth_state", state, cookieOptions);
    response.cookies.set("altr_gmail_oauth_verifier", pkce.verifier, cookieOptions);
    return response;
  } catch (error) {
    const code = error instanceof Error && error.message === "AUTH_REQUIRED" ? "auth" : "config";
    return NextResponse.redirect(new URL(`/connections?gmail=${code}`, request.nextUrl.origin));
  }
}
