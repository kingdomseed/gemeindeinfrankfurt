import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// Personal edit links, the coordinator area and the CMS stay out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/*/training/r/", "/*/training/coordinator"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
