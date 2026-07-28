import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.next();
  const supabase = createSupabaseServerClient(response);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/auth?mode=login&error=oauth", origin));
  }
  const redirect = NextResponse.redirect(data.url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
