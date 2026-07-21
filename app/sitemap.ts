import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

/** Only the real, public marketing/legal routes — see `robots.ts` for the matching disallow list. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const routes = ["", "/pricing", "/privacy", "/terms", "/cookies"];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
