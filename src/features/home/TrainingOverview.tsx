import { Button, Flex, Span, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { Link } from "@/i18n/navigation";
import type { TrainingWithSessions } from "@/lib/data";
import { canRegister, computeCutoffs } from "@/lib/domain/cutoffs";
import { formatEuro } from "@/lib/domain/fees";
import { berlinDay } from "@/lib/domain/sessions";

import { ChangeCutoffs } from "./ChangeCutoffs";
import { ScheduleByDay } from "./ScheduleByDay";
import { SeatsExplained } from "./SeatsExplained";

// The landing page: title, fee and how long registration is open, then the
// schedule, the seat types and what can be changed later.
export function TrainingOverview({ training }: { training: TrainingWithSessions }) {
  const t = useTranslations("home");
  const tr = useTranslations("register");
  const locale = useLocale();
  const cutoffs = computeCutoffs(training.sessions);
  return (
    <Stack gap="10">
      <Stack gap="4" align="flex-start">
        <PageHeading title={training.title[locale]} />
        <Text fontSize="lg" fontVariantNumeric="tabular-nums">
          {t("fee", {
            fee: formatEuro(training.fee_cents, locale),
            outline: formatEuro(training.outline_price_cents, locale),
          })}
        </Text>
        {cutoffs && canRegister(training.sessions) ? (
          <Flex wrap="wrap" align="center" columnGap="5" rowGap="3">
            <Button asChild px="6">
              <Link href="/register">{t("register")}</Link>
            </Button>
            <Text fontSize="sm" color="fg.muted">
              {t("openUntil", { day: berlinDay(cutoffs.registrationClosesAt, locale) })}
            </Text>
          </Flex>
        ) : (
          <Text color="fg.muted">{tr("closed")}</Text>
        )}
      </Stack>
      <Notice tone="neutral">
        <Span fontWeight="medium">{t("freeSeatsTitle")}</Span> {t("freeSeats")}
      </Notice>
      <ScheduleByDay sessions={training.sessions} />
      <SeatsExplained />
      {cutoffs && <ChangeCutoffs seatLockAt={cutoffs.seatAndSessionsLockAt} />}
    </Stack>
  );
}
