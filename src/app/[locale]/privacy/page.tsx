import { getTranslations, setRequestLocale } from "next-intl/server";

import { PrivacyNotice } from "@/features/privacy/PrivacyNotice";
import { requireLocale } from "@/i18n/locale";
import { siteContacts } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("title") };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  setRequestLocale(requireLocale((await params).locale));
  return <PrivacyNotice contacts={siteContacts()} />;
}
