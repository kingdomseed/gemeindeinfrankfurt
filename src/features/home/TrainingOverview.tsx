import { Box, Button, Heading, List, Span, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import { Link } from "@/i18n/navigation";
import type { TrainingWithSessions } from "@/lib/data";
import { formatEuro } from "@/lib/domain/fees";
import { sessionLabel } from "@/lib/domain/sessions";

// The landing page: title, fee, a register button and the schedule.
export function TrainingOverview({ training }: { training: TrainingWithSessions }) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  return (
    <Stack gap="10">
      <Stack gap="4" align="flex-start">
        <PageHeading title={training.title[locale]} />
        <Text fontSize="lg">
          {t("fee", {
            fee: formatEuro(training.fee_cents, locale),
            outline: formatEuro(training.outline_price_cents, locale),
          })}
        </Text>
        <Button asChild px="6">
          <Link href="/register">{t("register")}</Link>
        </Button>
      </Stack>
      <Box as="section" aria-labelledby="schedule-heading">
        <Heading as="h2" id="schedule-heading" size="xl">
          {t("schedule")}{" "}
          <Span fontSize="md" fontWeight="normal" color="fg.muted">
            · {t("scheduleCount", { count: training.sessions.length })}
          </Span>
        </Heading>
        <Text mt="1" fontSize="sm" color="fg.muted">
          {tc("timezone")}
        </Text>
        <List.Root
          as="ol"
          listStyle="none"
          mt="4"
          borderYWidth="1px"
          fontVariantNumeric="tabular-nums"
        >
          {training.sessions.map((s, i) => (
            <List.Item key={s.id} py="2" borderTopWidth={i === 0 ? "0" : "1px"}>
              {sessionLabel(s, locale, t("message", { number: s.message_number }))}
            </List.Item>
          ))}
        </List.Root>
      </Box>
    </Stack>
  );
}
