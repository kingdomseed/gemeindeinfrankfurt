import { Heading, SimpleGrid, Stack } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { FactBox } from "@/components/ui/fact-box";
import { daysUntil, type Deadlines } from "@/lib/domain/coordination";
import { berlinDay, berlinDayTime } from "@/lib/domain/sessions";

// The training's deadlines, soonest first as the year runs. The outline order
// is highlighted until it has passed, because it is the one that cannot slip.
export function DeadlineGrid(props: { deadlines: Deadlines; outlinesNeeded: number; now: Date }) {
  const t = useTranslations("coordinator");
  const th = useTranslations("home");
  const locale = useLocale();
  const { deadlines: d, now } = props;
  const when = (date: Date) => berlinDayTime(date, locale, th("lordsDay"));
  const left = (date: Date) => {
    const days = daysUntil(date, now);
    return days < 0 ? t("passed") : t("daysLeft", { count: days });
  };
  return (
    <Stack as="section" aria-labelledby="deadlines-heading" gap="3">
      <Heading as="h2" id="deadlines-heading" size="xl">
        {t("deadlinesTitle")}
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="3">
        {d.outlineOrderDue && (
          <FactBox
            tone={d.outlineOrderDue > now ? "warning" : "neutral"}
            label={t("deadline.outlineOrder")}
            value={when(d.outlineOrderDue)}
            note={`${left(d.outlineOrderDue)} · ${t("outlinesNeededCount", { count: props.outlinesNeeded })}`}
          />
        )}
        <FactBox
          tone="neutral"
          label={t("deadline.sessionsLock")}
          value={when(d.sessionsLock)}
          note={left(d.sessionsLock)}
        />
        <FactBox
          tone="neutral"
          label={t("deadline.registrationCloses")}
          value={when(d.registrationCloses)}
          note={t("endOfFirstDay")}
        />
        <FactBox
          tone="neutral"
          label={t("deadline.reportDue")}
          value={berlinDay(d.reportDue, locale, th("lordsDay"))}
          note={t("reportAfterLast")}
        />
      </SimpleGrid>
    </Stack>
  );
}
