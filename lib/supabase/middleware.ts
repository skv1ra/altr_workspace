import { createServerClient } from "@supabase/ssr";
import { NextResponse,type NextRequest } from "next/server";
import { e2eMocksEnabled,getE2EIdentity } from "@/lib/testing/e2e-auth";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/url";
const pages=["/dashboard","/onboarding","/memory","/assistants","/import-conversations","/billing","/settings","/privacy-center","/payment/success","/payment/receipt","/legacy-migration"];
const publicApiPrefixes=["/api/auth/","/api/webhooks/","/api/dev/"];
const publicApiExact=new Set(["/api/version","/api/health","/api/billing/plans","/api/privacy/deletion-requests"]);
const protectedPath=(p:string)=>pages.some(x=>p===x||p.startsWith(`${x}/`))||(p.startsWith("/api/")&&!publicApiExact.has(p)&&!publicApiPrefixes.some(x=>p.startsWith(x)));
export function safeRedirectPath(v:string|null,f="/dashboard"){return !v||!v.startsWith("/")||v.startsWith("//")||v.includes("\\")?f:v;}
function redirect(request:NextRequest,p:string){if(p.startsWith("/api/"))return NextResponse.json({error:"AUTH_REQUIRED"},{status:401});const u=request.nextUrl.clone();u.pathname="/auth";u.search="";u.searchParams.set("mode","login");u.searchParams.set("next",safeRedirectPath(`${p}${request.nextUrl.search}`));return NextResponse.redirect(u);}
export async function updateSession(request:NextRequest,requestHeaders=new Headers(request.headers)){
 let response=NextResponse.next({request:{headers:requestHeaders}});const p=request.nextUrl.pathname;
 if(e2eMocksEnabled()){if(getE2EIdentity(request.headers)){response.headers.set("Cache-Control","private, no-store");return response;}return protectedPath(p)?redirect(request,p):response;}
 const rawUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!rawUrl||!key)return protectedPath(p)?redirect(request,p):response;
 const url=normalizeSupabaseProjectUrl(rawUrl);
 const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request:{headers:requestHeaders}});values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
 const {data}=await supabase.auth.getUser();if(!data.user&&protectedPath(p))return redirect(request,p);
 if(data.user&&request.cookies.get("altr_legacy_review")?.value==="pending"){
  response.cookies.set("altr_legacy_review","",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});
 }
 response.headers.set("Cache-Control","private, no-store");return response;
}
