import { Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { PageHeading } from "@/components/ui/page-heading";
import type { ChurchEvent } from "@/lib/cms";

import { EventList } from "./EventList";

// The events page: every upcoming event, then a way to subscribe to them.
export function EventsOverview(props: { events: readonly ChurchEvent[]; subscribe: ReactNode }) {
  const t = useTranslations("site");
  return (
    <Stack gap="6">
      <PageHeading title={t("eventsTitle")} subtitle={t("eventsIntro")} />
      {props.events.length > 0 ? <EventList items={props.events} /> : <Text>{t("noEvents")}</Text>}
      {props.subscribe}
    </Stack>
  );
}
