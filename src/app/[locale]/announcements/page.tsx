import { getTranslations, setRequestLocale } from "next-intl/server";

import { AnnouncementArchive } from "@/features/church/AnnouncementArchive";
import { MainColumn } from "@/features/shell/MainColumn";
import { requireLocale } from "@/i18n/locale";
import { getAnnouncementArchive, getMeetingLink, getPageHrefs } from "@/lib/cms";

export async function generateMetadata({ params }: PageProps<"/[locale]/announcements">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "site" });
  // The page carries the meeting link, so search engines are told to leave it
  // out (with the X-Robots-Tag header in next.config.ts as well).
  return {
    title: t("announcementsTitle"),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AnnouncementsPage({ params }: PageProps<"/[locale]/announcements">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const [items, pageHrefs, meetingLink] = await Promise.all([
    getAnnouncementArchive(locale),
    getPageHrefs(locale),
    getMeetingLink(locale),
  ]);
  return (
    <MainColumn>
      <AnnouncementArchive items={items} pageHrefs={pageHrefs} meetingLink={meetingLink} />
    </MainColumn>
  );
}
