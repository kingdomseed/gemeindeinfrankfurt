import { Box, Heading, Link, List, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";
import type { RecentEvent } from "@/lib/coordinator";

import { detailHref, displayName } from "./display";
import type { RegistrationRow } from "./types";

type Change = { id: string; at: string; registrationId: string; text: string; actor: string };

// New registrations and the latest history lines across the training, newest first.
export function LatestChanges(props: {
  rows: readonly RegistrationRow[];
  events: readonly RecentEvent[];
  now: Date;
  limit?: number;
}) {
  const t = useTranslations("coordinator");
  const format = useFormatter();
  const changes: Change[] = [
    ...props.rows.map(({ registration: r }) => ({
      id: `new-${r.id}`,
      at: r.created_at,
      registrationId: r.id,
      text: t("newRegistration", { name: displayName(r), seat: t(`seatShort.${r.seat_type}`) }),
      actor: "",
    })),
    ...props.events.map((e) => ({
      id: e.id,
      at: e.created_at,
      registrationId: e.registration.id,
      text: `${t(`event.${e.kind}`)}: ${e.registration.first_name} ${e.registration.last_name}`,
      actor: e.actor_name,
    })),
  ]
    .toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, props.limit ?? 8);

  return (
    <Stack as="section" aria-labelledby="changes-heading" gap="3">
      <Heading as="h2" id="changes-heading" size="xl">
        {t("latestChanges")}
      </Heading>
      {changes.length === 0 ? (
        <Text color="fg.muted">{t("historyEmpty")}</Text>
      ) : (
        <List.Root as="ol" listStyle="none" borderTopWidth="1px" fontSize="sm">
          {changes.map((c) => (
            <List.Item
              key={c.id}
              display="grid"
              gridTemplateColumns={{ base: "1fr", sm: "8rem minmax(0, 1fr)" }}
              columnGap="4"
              py="2"
              borderBottomWidth="1px"
            >
              <Text color="fg.muted" fontVariantNumeric="tabular-nums">
                {format.relativeTime(new Date(c.at), props.now)}
              </Text>
              <Box>
                <Link asChild color="fg" textDecoration="underline">
                  <LocaleLink href={detailHref(c.registrationId)}>{c.text}</LocaleLink>
                </Link>
                {c.actor && (
                  <Text as="span" color="fg.muted">
                    {` · ${t("byActor", { name: c.actor })}`}
                  </Text>
                )}
              </Box>
            </List.Item>
          ))}
        </List.Root>
      )}
    </Stack>
  );
}
