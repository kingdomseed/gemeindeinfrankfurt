import { Box, Flex, Heading, List, Span, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { scheduleDays } from "@/lib/domain/sessions";
import type { Session } from "@/lib/domain/types";

// The schedule as one short list per day, in Frankfurt time.
export function ScheduleByDay({ sessions }: { sessions: Session[] }) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  return (
    <Box as="section" aria-labelledby="schedule-heading">
      <Flex wrap="wrap" align="baseline" justify="space-between" columnGap="4">
        <Heading as="h2" id="schedule-heading" size="xl">
          {t("schedule")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
          {t("scheduleCount", { count: sessions.length })}
        </Text>
      </Flex>
      <Stack gap="6" mt="3" fontVariantNumeric="tabular-nums">
        {scheduleDays(sessions, locale).map((day) => (
          <Box key={day.key}>
            <Heading
              as="h3"
              size="md"
              py="2"
              borderBottomWidth="1px"
              borderColor="border.emphasized"
            >
              {day.label}
            </Heading>
            <List.Root as="ol" listStyle="none">
              {day.sessions.map((s) => (
                <List.Item
                  key={s.id}
                  display="flex"
                  justifyContent="space-between"
                  gap="4"
                  py="2"
                  borderBottomWidth="1px"
                >
                  <span>{t("message", { number: s.number })}</span>
                  <Span color="fg.muted">{s.time}</Span>
                </List.Item>
              ))}
            </List.Root>
          </Box>
        ))}
      </Stack>
      <Text mt="3" fontSize="sm" color="fg.muted">
        {tc("timezone")}
      </Text>
    </Box>
  );
}
