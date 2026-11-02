import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Provider } from "@/components/ui/provider";
import { SiteShell } from "@/features/shell/SiteShell";
import { requireLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { siteContacts } from "@/lib/site";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: { default: t("appName"), template: `%s · ${t("appName")}` } };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    // next-themes sets the colour-mode class on <html> before React hydrates.
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <Provider>
            <SiteShell contacts={siteContacts()}>{children}</SiteShell>
          </Provider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
