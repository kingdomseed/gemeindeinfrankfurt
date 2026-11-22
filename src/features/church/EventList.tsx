import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import type { ChurchEvent } from "@/lib/cms";
import { eventWhen } from "@/lib/domain/events";

// Events in date order, each with when, what and, if given, where.
export function EventList({ items }: { items: readonly ChurchEvent[] }) {
  const t = useTranslations("home");
  const locale = useLocale();
  return (
    <Stack as="ul" gap="3" listStyleType="none">
      {items.map((item) => (
        <Box
          as="li"
          key={item.id}
          borderWidth="1px"
          borderStartWidth="4px"
          borderStartColor="brand.solid"
          rounded="l2"
          p="4"
        >
          <Text fontSize="sm" fontWeight="medium" color="brand.fg">
            <time dateTime={item.startsAt.toISOString()}>
              {eventWhen(item.startsAt, item.endsAt, locale, t("lordsDay"))}
            </time>
          </Text>
          <Heading as="h3" size="md" mt="1">
            {item.title}
          </Heading>
          {item.location && (
            <Text fontSize="sm" color="fg.muted" mt="1">
              {item.location}
            </Text>
          )}
          {item.details && (
            <Text mt="2" whiteSpace="pre-line">
              {item.details}
            </Text>
          )}
        </Box>
      ))}
    </Stack>
  );
}
