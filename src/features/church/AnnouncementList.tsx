import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";
import type { Announcement } from "@/lib/cms";

import { PageBody } from "./PageBody";

type AnnouncementItems = { items: readonly Announcement[]; pageHrefs: Record<string, string> };

// Announcements as cards, in the order given.
export function AnnouncementCards(props: AnnouncementItems) {
  const format = useFormatter();
  return (
    <Stack as="ul" gap="3" listStyleType="none">
      {props.items.map((item) => (
        <Box
          as="li"
          key={item.id}
          borderWidth="1px"
          borderStartWidth="4px"
          borderStartColor="brand.solid"
          rounded="l2"
          p="4"
        >
          <Text fontSize="sm" color="fg.muted">
            <time dateTime={item.publishedAt.toISOString()}>
              {format.dateTime(item.publishedAt, { dateStyle: "long" })}
            </time>
          </Text>
          <Heading as="h3" size="md" mt="1">
            {item.title}
          </Heading>
          {item.body && (
            <Box mt="2">
              <PageBody content={item.body} pageHrefs={props.pageHrefs} />
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}

// The latest announcements as a page section, with a link to all of them. Nothing is shown when there are none.
export function AnnouncementList(props: AnnouncementItems & { heading: string }) {
  const t = useTranslations("site");
  if (props.items.length === 0) return null;
  return (
    <Stack as="section" gap="4">
      <Heading as="h2" size="xl">
        {props.heading || t("announcements")}
      </Heading>
      <AnnouncementCards items={props.items} pageHrefs={props.pageHrefs} />
      <Link asChild color="brand.fg" textDecoration="underline" alignSelf="flex-start">
        <LocaleLink href="/announcements">{t("allAnnouncements")}</LocaleLink>
      </Link>
    </Stack>
  );
}
