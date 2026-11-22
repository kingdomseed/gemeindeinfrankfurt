import { Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import type { Announcement } from "@/lib/cms";

import { AnnouncementCards } from "./AnnouncementList";

// The announcements page: every announcement so far, newest first.
export function AnnouncementArchive(props: {
  items: readonly Announcement[];
  pageHrefs: Record<string, string>;
}) {
  const t = useTranslations("site");
  return (
    <Stack gap="6">
      <PageHeading title={t("announcementsTitle")} subtitle={t("announcementsIntro")} />
      {props.items.length > 0 ? (
        <AnnouncementCards items={props.items} pageHrefs={props.pageHrefs} />
      ) : (
        <Text>{t("noAnnouncements")}</Text>
      )}
    </Stack>
  );
}
