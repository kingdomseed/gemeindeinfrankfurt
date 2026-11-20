import { Box, Heading, HStack, Span, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { Panel } from "@/components/ui/panel";
import { StatusTag } from "@/components/ui/status-tag";
import { formatEuro, type FeeBreakdown } from "@/lib/domain/fees";

import { PaymentLine } from "./PaymentLine";
import type { PaymentDetails } from "./types";

// On the edit page: what was owed, what the coordinators have ticked as
// received, and what is still to pay.
export function PaymentStatus(props: {
  fees: FeeBreakdown;
  feePaid: boolean;
  outlinePaid: boolean;
  payment: PaymentDetails;
}) {
  const t = useTranslations("edit");
  const tr = useTranslations("register");
  const locale = useLocale();
  const euro = (cents: number) => formatEuro(cents, locale);
  const { fees } = props;
  const open =
    (props.feePaid ? 0 : fees.trainingCents) + (props.outlinePaid ? 0 : fees.outlineCents);
  const line = (label: string, paid: boolean) => (
    <HStack wrap="wrap" gap="2">
      <Span>{label}</Span>
      <StatusTag tone={paid ? "success" : "warning"}>
        {paid ? t("received") : t("notReceived")}
      </StatusTag>
    </HStack>
  );
  return (
    <Panel aria-labelledby="payment-heading">
      <Heading as="h2" id="payment-heading" size="lg">
        {t("paymentTitle")}
      </Heading>
      <Box as="dl">
        {fees.trainingCents > 0 && (
          <PaymentLine label={line(tr("trainingFee"), props.feePaid)}>
            {euro(fees.trainingCents)}
          </PaymentLine>
        )}
        {fees.outlineCents > 0 && (
          <PaymentLine
            label={line(tr("outlines", { count: fees.outlineCount }), props.outlinePaid)}
          >
            {euro(fees.outlineCents)}
          </PaymentLine>
        )}
        <PaymentLine label={t("stillToPay")} total>
          {euro(open)}
        </PaymentLine>
      </Box>
      {open > 0 && (
        <Text fontSize="sm">
          {t("payTo", { iban: props.payment.iban, reference: props.payment.reference })}
        </Text>
      )}
    </Panel>
  );
}
