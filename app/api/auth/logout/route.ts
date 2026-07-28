import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseServerClient(response);
  await supabase.auth.signOut();
  response.cookies.set("altr_legacy_review", "", { path: "/", maxAge: 0 });
  return response;
}
