import { Heading, Link, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";

import { AnnouncementCards, type AnnouncementItems } from "./AnnouncementCards";

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
