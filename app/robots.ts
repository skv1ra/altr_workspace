import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

/**
 * Disallow list mirrors `lib/supabase/middleware.ts`'s own protected-path
 * list (`/dashboard`, `/memory`, `/assistants`, `/import-conversations`,
 * `/billing`, `/payment/success`, `/legacy-migration`) plus `/api/`,
 * `/auth` (session flows, nothing to index), and the two dev-only routes
 * `/hero-lab`/`/styleguide` — never real marketing surface. Keeping this
 * list in sync with the auth middleware is manual (Next has no shared
 * route-manifest to derive from at this layer), so update both together.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth",
        "/dashboard",
        "/memory",
        "/assistants",
        "/import-conversations",
        "/billing",
        "/payment/success",
        "/legacy-migration",
        "/hero-lab",
        "/styleguide",
      ],
    },
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
