import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ChurchPage } from "@/features/church/ChurchPage";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { findPage, getNavigation, getPageContent, getSiteSettings } from "@/lib/cms";

// Runs once for each language the layout builds, or never when it builds none.
export async function generateStaticParams({ params }: { params: { locale?: string } }) {
  if (!hasLocale(routing.locales, params.locale)) return [];
  const pages = await getNavigation(params.locale);
  return pages.filter((page) => !page.isHome).map((page) => ({ slug: page.slug }));
}

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
  return <ChurchPage slug={slug} page={page} settings={settings} />;
}
