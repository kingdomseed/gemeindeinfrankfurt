import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getPageSlugs } from "@/lib/cms";
import { sitemapEntries } from "@/lib/domain/sitemap";
import { siteUrl } from "@/lib/site";

// Pages come from the CMS, so the sitemap is built on request, not at build time.
export const dynamic = "force-dynamic";

const fixedPaths = ["training", "training/register", "privacy"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = sitemapEntries(
    siteUrl(),
    routing.locales,
    routing.defaultLocale,
    await getPageSlugs(),
    fixedPaths,
  );
  return entries.map(({ url, languages }) => ({ url, alternates: { languages } }));
}
