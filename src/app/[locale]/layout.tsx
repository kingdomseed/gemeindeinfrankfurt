import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { requireLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("appName") };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider>
          <header className="mx-auto flex max-w-3xl justify-end px-4 py-3">
            <LanguageSwitcher />
          </header>
          <main className="mx-auto max-w-3xl px-4 pb-16">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
