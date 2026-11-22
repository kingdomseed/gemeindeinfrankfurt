import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Provider } from "@/components/ui/provider";
import { SiteShell } from "@/features/shell/SiteShell";
import { requireLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { canReachCms, getNavigation, getSiteSettings } from "@/lib/cms";

// Church pages are built once in every language and served from the cache.
// A CMS edit refreshes them at once; otherwise they are rebuilt at most once
// an hour after a visit, so announcements appear and end on time.
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await canReachCms()) ? routing.locales.map((locale) => ({ locale })) : [];
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { siteName } = await getSiteSettings(requireLocale((await params).locale));
  return { title: { default: siteName, template: `%s · ${siteName}` } };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [settings, pages] = await Promise.all([getSiteSettings(locale), getNavigation(locale)]);

  return (
    // next-themes sets the colour-mode class on <html> before React hydrates.
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <Provider>
            <SiteShell siteName={settings.siteName} tagline={settings.tagline} pages={pages}>
              {children}
            </SiteShell>
          </Provider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
