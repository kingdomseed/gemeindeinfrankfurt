import { Heading, Span, Stack } from "@chakra-ui/react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import type { Announcement } from "@/lib/cms";
import { capitalized, midMonth, monthAnchor } from "@/lib/domain/announcements";

import { AnnouncementWeeks } from "./AnnouncementWeeks";

// One month of announcements, under a heading that stays in view while
// its weeks scroll past.
export function AnnouncementMonth(props: {
  month: string;
  items: readonly Announcement[];
  pageHrefs: Record<string, string>;
}) {
  const t = useTranslations("site");
  const format = useFormatter();
  const locale = useLocale();
  return (
    <Stack as="section" aria-labelledby={monthAnchor(props.month)} gap="3">
      <Heading
        as="h3"
        id={monthAnchor(props.month)}
        size="lg"
        position="sticky"
        top="0"
        zIndex="1"
        bg="bg"
        py="2"
        scrollMarginTop="4"
        borderBottomWidth="1px"
        display="flex"
        alignItems="baseline"
        justifyContent="space-between"
        gap="3"
      >
        {capitalized(
          format.dateTime(midMonth(props.month), { month: "long", year: "numeric" }),
          locale,
        )}
        <Span fontFamily="body" fontSize="sm" fontWeight="normal" color="fg.muted">
          {t("weekCount", { count: props.items.length })}
        </Span>
      </Heading>
      <AnnouncementWeeks items={props.items} pageHrefs={props.pageHrefs} />
    </Stack>
  );
}
