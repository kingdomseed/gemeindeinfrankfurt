import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import type { Announcement } from "@/lib/cms";
import { groupByMonth } from "@/lib/domain/announcements";

import { AnnouncementMonth } from "./AnnouncementMonth";
import { AnnouncementMonthNav } from "./AnnouncementMonthNav";
import { LatestAnnouncement } from "./LatestAnnouncement";

// The announcements page: the meeting link, the latest announcement in full,
// then the earlier ones by month, each week folded down to its headlines.
export function AnnouncementArchive(props: {
  items: readonly Announcement[];
  pageHrefs: Record<string, string>;
  meetingLink: string | null;
}) {
  const t = useTranslations("site");
  const [latest, ...earlier] = props.items;
  const months = groupByMonth(earlier, (item) => item.publishedAt);
  return (
    <Stack gap="8">
      <Stack gap="4">
        <PageHeading title={t("announcementsTitle")} subtitle={t("announcementsIntro")} />
        {months.length > 0 && <AnnouncementMonthNav months={months} />}
      </Stack>
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
      {latest ? (
        <LatestAnnouncement item={latest} pageHrefs={props.pageHrefs} />
      ) : (
        <Text>{t("noAnnouncements")}</Text>
      )}
      {months.length > 0 && (
        <Stack as="section" aria-labelledby="earlier-announcements" gap="6">
          <Heading as="h2" id="earlier-announcements" size="xl">
            {t("earlierAnnouncements")}
          </Heading>
          {months.map((group) => (
            <AnnouncementMonth
              key={group.month}
              month={group.month}
              items={group.items}
              pageHrefs={props.pageHrefs}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
