import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ChurchPage } from "@/features/church/ChurchPage";
import { requireLocale } from "@/i18n/locale";
import { getHomePageId, getPageContent, getSiteSettings } from "@/lib/cms";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const [homeId, settings] = await Promise.all([getHomePageId(), getSiteSettings(locale)]);
  if (homeId === null) notFound();
  const page = await getPageContent(homeId, locale);
  return <ChurchPage page={page} settings={settings} />;
}
