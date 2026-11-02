import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { requireLocale } from "@/i18n/locale";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteContacts } from "@/lib/site";

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
  const t = await getTranslations({ locale, namespace: "common" });
  const contacts = siteContacts();

  return (
    <html lang={locale}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider>
          <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 px-4 py-3">
            <Link href="/" className="font-semibold no-underline">
              {t("appName")}
            </Link>
            <LanguageSwitcher label={t("languageNav")} />
          </header>
          <main className="mx-auto max-w-3xl px-4 pt-6 pb-16">{children}</main>
          <footer className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-1 border-t border-line px-4 py-6 text-sm text-muted">
            {contacts.length > 0 && (
              <p>
                {t("questions")}{" "}
                {contacts.map((c, i) => (
                  <span key={c.email}>
                    {i > 0 && ", "}
                    <a href={`mailto:${c.email}`} className="underline">
                      {c.name}
                    </a>
                  </span>
                ))}
              </p>
            )}
            <Link href="/privacy" className="underline">
              {t("privacy")}
            </Link>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
