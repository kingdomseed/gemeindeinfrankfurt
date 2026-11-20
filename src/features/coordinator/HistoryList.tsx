import { Heading, List, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

import type { RegistrationEvent } from "@/lib/coordinator";

// What happened to a registration and who did it, newest first.
export function HistoryList({ events }: { events: readonly RegistrationEvent[] }) {
  const t = useTranslations("coordinator");
  const format = useFormatter();
  return (
    <Stack as="section" aria-labelledby="history-heading" gap="3" borderTopWidth="1px" pt="6">
      <Heading as="h2" id="history-heading" size="xl">
        {t("historyTitle")}
      </Heading>
      {events.length === 0 ? (
        <Text color="fg.muted">{t("historyEmpty")}</Text>
      ) : (
        <List.Root listStyle="none" gap="2">
          {events.map((e) => (
            <List.Item key={e.id} display="block">
              {t(`event.${e.kind}`)}
              <Text as="span" display="block" fontSize="sm" color="fg.muted">
                {format.dateTime(new Date(e.created_at), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {e.actor_name && ` · ${t("byActor", { name: e.actor_name })}`}
              </Text>
            </List.Item>
          ))}
        </List.Root>
      )}
    </Stack>
  );
}
