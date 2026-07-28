import { NextResponse } from "next/server";
import { getCurrentPlanPricing } from "@/lib/billing/lemonsqueezy";
import { knownPlanDisplay, paidPlanIds } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  let pricing;
  try {
    pricing = await getCurrentPlanPricing();
  } catch {
    pricing = paidPlanIds.map((planId) => ({
      planId,
      ...knownPlanDisplay[planId],
      live: false,
    }));
  }
  return NextResponse.json({
    plans: pricing,
    notice: pricing.every((plan) => plan.live)
      ? null
      : "Displayed prices use known metadata. The final amount is confirmed in Lemon Squeezy checkout.",
  });
}
