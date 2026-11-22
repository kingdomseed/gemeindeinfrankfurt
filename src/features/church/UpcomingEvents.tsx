import { Flex, Heading, Link, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";
import type { ChurchEvent } from "@/lib/cms";

import { EventList } from "./EventList";

// The next few events as a page section, with links to all of them and to the
// calendar feed. Nothing is shown when no event is coming up.
export function UpcomingEvents(props: { heading: string; items: readonly ChurchEvent[] }) {
  const t = useTranslations("site");
  if (props.items.length === 0) return null;
  return (
    <Stack as="section" gap="4">
      <Heading as="h2" size="xl">
        {props.heading || t("upcomingEvents")}
      </Heading>
      <EventList items={props.items} />
      <Flex gap="4" wrap="wrap">
        <Link asChild color="brand.fg" textDecoration="underline">
          <LocaleLink href="/events">{t("allEvents")}</LocaleLink>
        </Link>
        <Link asChild color="brand.fg" textDecoration="underline">
          <LocaleLink href="/events.ics" prefetch={false}>
            {t("subscribeEvents")}
          </LocaleLink>
        </Link>
      </Flex>
    </Stack>
  );
}
