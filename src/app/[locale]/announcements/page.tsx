import { getTranslations, setRequestLocale } from "next-intl/server";

import { AnnouncementArchive } from "@/features/church/AnnouncementArchive";
import { MainColumn } from "@/features/shell/MainColumn";
import { requireLocale } from "@/i18n/locale";
import { getAnnouncementArchive, getPageHrefs } from "@/lib/cms";

export async function generateMetadata({ params }: PageProps<"/[locale]/announcements">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "site" });
  return { title: t("announcementsTitle") };
}

export default async function AnnouncementsPage({ params }: PageProps<"/[locale]/announcements">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const [items, pageHrefs] = await Promise.all([
    getAnnouncementArchive(locale),
    getPageHrefs(locale),
  ]);
  return (
    <MainColumn>
      <AnnouncementArchive items={items} pageHrefs={pageHrefs} />
    </MainColumn>
  );
}
