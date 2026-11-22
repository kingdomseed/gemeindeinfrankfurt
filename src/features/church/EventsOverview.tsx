import { Link, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import { Link as LocaleLink } from "@/i18n/navigation";
import type { ChurchEvent } from "@/lib/cms";

import { EventList } from "./EventList";

// The events page: every upcoming event, and the calendar feed.
export function EventsOverview({ events }: { events: readonly ChurchEvent[] }) {
  const t = useTranslations("site");
  return (
    <Stack gap="6">
      <PageHeading title={t("eventsTitle")} subtitle={t("eventsIntro")} />
      {events.length > 0 ? <EventList items={events} /> : <Text>{t("noEvents")}</Text>}
      <Link asChild color="brand.fg" textDecoration="underline" alignSelf="flex-start">
        <LocaleLink href="/events.ics" prefetch={false}>
          {t("subscribeEvents")}
        </LocaleLink>
      </Link>
    </Stack>
  );
}
