import { Box, Button, Flex, Grid, Heading, Link, List, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { DetailItem } from "@/components/ui/detail-item";
import { focusOnMount } from "@/components/ui/focus";
import { Panel } from "@/components/ui/panel";
import { Link as LocaleLink } from "@/i18n/navigation";
import { formatEuro, type FeeBreakdown } from "@/lib/domain/fees";

import { AddToCalendar } from "./AddToCalendar";
import { PaymentLine } from "./PaymentLine";
import { TransferDetails } from "./TransferDetails";
import type { PaymentDetails, SubmittedSummary } from "./types";

const nextSteps = ["nextPaid", "nextBefore", "nextChange"] as const;

// Shown after a successful registration, so the transfer details stay on screen
// even if the confirmation email lands in spam.
export function Receipt(props: {
  fees: FeeBreakdown;
  summary: SubmittedSummary;
  sessionCount: number;
  payment: PaymentDetails;
  calendarUrl: string;
  onRegisterAnother: () => void;
}) {
  const t = useTranslations("register");
  const tc = useTranslations("calendar");
  const tl = useTranslations("common.languages");
  const locale = useLocale();
  const euro = (cents: number) => formatEuro(cents, locale);
  const { fees, summary } = props;
  const hasTrainingFee = fees.trainingCents > 0;
  const hasOutlineFee = fees.outlineCents > 0;
  const hasPayment = hasTrainingFee || hasOutlineFee;
  const hasBothPayments = hasTrainingFee && hasOutlineFee;
  const messages =
    summary.chosenSessions === null
      ? t("messagesAll", { total: props.sessionCount })
      : t("messagesChosen", { count: summary.chosenSessions, total: props.sessionCount });
  return (
    <Stack gap="10" align="stretch">
      <Panel
        ref={focusOnMount}
        tabIndex={-1}
        tone="success"
        outline="none"
        gap="2"
        css={{
          transition: "opacity 240ms {easings.ui-out}, transform 240ms {easings.ui-out}",
          "@starting-style": { opacity: 0, transform: "scale(0.97) translateY(6px)" },
          "@media (prefers-reduced-motion: reduce)": {
            transition: "opacity 180ms ease",
            "@starting-style": { opacity: 0, transform: "none" },
          },
        }}
      >
        <Text fontSize="lg" fontWeight="medium">
          {t("receiptThanks")}
        </Text>
        <Heading as="h2" size="xl">
          {t("receiptTitle")}
        </Heading>
        <Text>{t("receiptBody")}</Text>
      </Panel>

      {hasPayment && (
        <Panel aria-labelledby="transfer-heading">
          <Stack gap="1">
            <Heading as="h2" id="transfer-heading" size="lg">
              {hasBothPayments ? t("receiptPaySeparate") : t("receiptPayOne")}
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              {hasBothPayments ? t("paySeparateHint") : t("payHint")}
            </Text>
          </Stack>
          <TransferDetails payment={props.payment} />
          <Stack as="dl" gap="2">
            {hasTrainingFee && (
              <PaymentLine label={t("trainingFee")}>{euro(fees.trainingCents)}</PaymentLine>
            )}
            {hasOutlineFee && (
              <PaymentLine label={t("outlines", { count: fees.outlineCount })}>
                {euro(fees.outlineCents)}
              </PaymentLine>
            )}
          </Stack>
        </Panel>
      )}

      <Card>
        <AddToCalendar icsUrl={props.calendarUrl} label={tc("yourMessages")} />
      </Card>

      <Box as="section" aria-labelledby="summary-heading">
        <Heading as="h2" id="summary-heading" size="xl">
          {t("summaryTitle")}
        </Heading>
        <Grid
          as="dl"
          mt="3"
          templateColumns={{ base: "1fr", sm: "max-content 1fr" }}
          columnGap="6"
          rowGap="2"
        >
          <DetailItem label={t("summaryName")}>{summary.name}</DetailItem>
          {summary.locality && (
            <DetailItem label={t("summaryLocality")}>{summary.locality}</DetailItem>
          )}
          {summary.site && <DetailItem label={t("summarySite")}>{summary.site}</DetailItem>}
          <DetailItem label={t("summarySeat")}>
            {t(`seat.${summary.seatType}`)}, {messages}
          </DetailItem>
          <DetailItem label={t("summaryGroup")}>{tl(summary.groupLanguage)}</DetailItem>
          {summary.outlineLanguage && (
            <DetailItem label={t("summaryOutline")}>
              {tl(summary.outlineLanguage)}
              {summary.secondOutlineLanguage && ` + ${tl(summary.secondOutlineLanguage)}`}
            </DetailItem>
          )}
          <DetailItem label={t("summaryEmail")}>{summary.email}</DetailItem>
        </Grid>
      </Box>

      <Box as="section" aria-labelledby="next-heading">
        <Heading as="h2" id="next-heading" size="xl">
          {t("nextTitle")}
        </Heading>
        <List.Root as="ol" mt="3" ps="5" gap="2">
          {nextSteps
            .filter((key) => key !== "nextPaid" || hasPayment)
            .map((key) => (
              <List.Item key={key}>{t(key)}</List.Item>
            ))}
        </List.Root>
      </Box>

      <Flex wrap="wrap" align="center" columnGap="4" rowGap="3">
        <Button variant="outline" px="6" onClick={props.onRegisterAnother}>
          {t("registerAnother")}
        </Button>
        <Link asChild minH="11">
          <LocaleLink href="/training">{t("backToSchedule")}</LocaleLink>
        </Link>
      </Flex>
    </Stack>
  );
}
