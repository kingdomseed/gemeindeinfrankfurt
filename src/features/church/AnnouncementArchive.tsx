import { Box, Link, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import type { Announcement } from "@/lib/cms";

import { AnnouncementCards } from "./AnnouncementCards";

// The announcements page: the meeting link, then every announcement so far,
// newest first.
export function AnnouncementArchive(props: {
  items: readonly Announcement[];
  pageHrefs: Record<string, string>;
  meetingLink: string | null;
}) {
  const t = useTranslations("site");
  return (
    <Stack gap="6">
      <PageHeading title={t("announcementsTitle")} subtitle={t("announcementsIntro")} />
      {props.meetingLink && (
        <Box borderWidth="1px" rounded="l2" p="4" bg="bg.subtle">
          <Text fontWeight="semibold">{t("meetingLinkHeading")}</Text>
          <Link
            href={props.meetingLink}
            rel="nofollow noreferrer"
            target="_blank"
            color="brand.fg"
            textDecoration="underline"
          >
            {t("meetingLinkAction")}
          </Link>
        </Box>
      )}
      {props.items.length > 0 ? (
        <AnnouncementCards items={props.items} pageHrefs={props.pageHrefs} />
      ) : (
        <Text>{t("noAnnouncements")}</Text>
      )}
    </Stack>
  );
}
