import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ChurchPage } from "@/features/church/ChurchPage";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { findPage, getPageContent, getSiteSettings } from "@/lib/cms";

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">) {
  const { locale, slug } = await params;
  const match = await findPage(requireLocale(locale), slug);
  return match ? { title: match.title } : {};
}

export default async function CmsPage({ params }: PageProps<"/[locale]/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const match = await findPage(locale, slug);
  if (!match) notFound();
  // The home page lives at /[locale]; a slug from another language goes to
  // this language's slug.
  if (match.isHome) return redirect({ href: "/", locale });
  if (match.slug !== slug) return redirect({ href: `/${match.slug}`, locale });

  const [page, settings] = await Promise.all([
    getPageContent(match.id, locale),
    getSiteSettings(locale),
  ]);
  return <ChurchPage page={page} settings={settings} />;
}
