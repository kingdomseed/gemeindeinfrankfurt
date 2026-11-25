import { Box, Flex, Heading, List, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { daysUntil, type Deadlines } from "@/lib/domain/coordination";
import { berlinShortDay, berlinShortDayTime } from "@/lib/domain/sessions";

type DeadlineRow = {
  key: string;
  label: string;
  detail?: string | undefined;
  when: string;
  countdown?: string | undefined;
  urgent?: boolean | undefined;
};

// The training's key milestones as a chronological hairline list, matching
// Needs attention and Latest changes below on the overview page.
export function DeadlineGrid(props: { deadlines: Deadlines; outlinesNeeded: number; now: Date }) {
  const t = useTranslations("coordinator");
  const th = useTranslations("home");
  const locale = useLocale();
  const { deadlines: d, now } = props;
  const when = (date: Date) => berlinShortDayTime(date, locale, th("lordsDay"));
  const left = (date: Date) => {
    const days = daysUntil(date, now);
    return days < 0 ? t("passed") : t("daysLeft", { count: days });
  };

  const rows: DeadlineRow[] = [
    ...(d.outlineOrderDue
      ? [
          {
            key: "outlineOrder",
            label: t("deadline.outlineOrder"),
            detail: t("outlinesNeededCount", { count: props.outlinesNeeded }),
            when: when(d.outlineOrderDue),
            countdown: left(d.outlineOrderDue),
            urgent: d.outlineOrderDue > now,
          },
        ]
      : []),
    {
      key: "sessionsLock",
      label: t("deadline.sessionsLock"),
      when: when(d.sessionsLock),
      countdown: left(d.sessionsLock),
    },
    {
      key: "registrationCloses",
      label: t("deadline.registrationCloses"),
      when: when(d.registrationCloses),
    },
    {
      key: "reportDue",
      label: t("deadline.reportDue"),
      when: berlinShortDay(d.reportDue, locale, th("lordsDay")),
    },
  ];

  return (
    <Stack as="section" aria-labelledby="deadlines-heading" gap="3">
      <Heading as="h2" id="deadlines-heading" size="xl">
        {t("deadlinesTitle")}
      </Heading>
      <List.Root listStyle="none" borderTopWidth="1px">
        {rows.map((row) => (
          <List.Item
            key={row.key}
            display="block"
            py="2.5"
            px="3"
            borderBottomWidth="1px"
            bg={row.urgent ? "bg.warning" : undefined}
            color={row.urgent ? "fg.warning" : undefined}
            rounded={row.urgent ? "md" : undefined}
          >
            <Flex
              direction={{ base: "column", sm: "row" }}
              justify="space-between"
              align={{ base: "flex-start", sm: "baseline" }}
              columnGap="6"
              rowGap="1"
            >
              <Box>
                <Text as="span" fontWeight="medium">
                  {row.label}
                </Text>
                {row.detail && (
                  <Text as="span" fontSize="sm" color={row.urgent ? undefined : "fg.muted"}>
                    {` · ${row.detail}`}
                  </Text>
                )}
              </Box>
              <Text
                fontSize="sm"
                fontVariantNumeric="tabular-nums"
                color={row.urgent ? undefined : "fg.muted"}
                whiteSpace={{ base: "normal", sm: "nowrap" }}
              >
                {row.countdown ? `${row.when} · ${row.countdown}` : row.when}
              </Text>
            </Flex>
          </List.Item>
        ))}
      </List.Root>
    </Stack>
  );
}
