import { getTranslations, setRequestLocale } from "next-intl/server";

import { ImprintNotice } from "@/features/imprint/ImprintNotice";
import { MainColumn } from "@/features/shell/MainColumn";
import { requireLocale } from "@/i18n/locale";
import { getSiteSettings } from "@/lib/cms";
import { imprintContact } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/impressum">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "imprint" });
  return { title: t("title") };
}

export default async function ImprintPage({ params }: PageProps<"/[locale]/impressum">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const settings = await getSiteSettings(locale);
  const responsible = imprintContact();
  return (
    <MainColumn>
      <ImprintNotice
        siteName={settings.siteName}
        address={settings.meetingAddress}
        responsible={responsible.name}
        email={responsible.email ?? settings.contactEmail}
      />
    </MainColumn>
  );
}
