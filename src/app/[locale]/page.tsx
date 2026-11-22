import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { HomePage as HomeContent } from "@/features/church/HomePage";
import { requireLocale } from "@/i18n/locale";
import { getHomePageId, getPageContent, getPageTeasers, getSiteSettings } from "@/lib/cms";
import { firstParagraph } from "@/lib/domain/rich-text";

// Search previews show the opening paragraph of the church's introduction.
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = requireLocale((await params).locale);
  const homeId = await getHomePageId();
  if (homeId === null) return {};
  const page = await getPageContent(homeId, locale);
  const intro = page.blocks.find((block) => block.type === "text");
  const description = firstParagraph(intro?.content ?? page.body);
  return description ? { description } : {};
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const [homeId, settings, teasers] = await Promise.all([
    getHomePageId(),
    getSiteSettings(locale),
    getPageTeasers(locale),
  ]);
  if (homeId === null) notFound();
  const page = await getPageContent(homeId, locale);
  return <HomeContent page={page} teasers={teasers} settings={settings} />;
}
