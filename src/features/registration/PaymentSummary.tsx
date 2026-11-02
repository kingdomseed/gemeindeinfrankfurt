import { Box, Heading, Input, Span, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { formatEuro, type FeeBreakdown } from "@/lib/domain/fees";

import { PaymentLine } from "./PaymentLine";
import { TransferDetails } from "./TransferDetails";
import type { PaymentDetails } from "./types";

// The live total while the form is filled in, the transfer details, and who pays.
export function PaymentSummary(props: {
  fees: FeeBreakdown;
  payment: PaymentDetails;
  payerName?: string | undefined;
}) {
  const t = useTranslations("register");
  const locale = useLocale();
  const euro = (cents: number) => formatEuro(cents, locale);
  const { fees } = props;
  return (
    <Box as="section" aria-labelledby="payment-heading" bg="brand.subtle" rounded="xl" p="5">
      <Heading as="h2" id="payment-heading" size="lg" fontWeight="semibold">
        {t("sectionPayment")}
      </Heading>
      <Box as="dl" mt="3">
        <PaymentLine label={t("trainingFee")}>
          {fees.waived && (
            <Span fontSize="sm" color="fg.muted">
              {t("waived")}{" "}
            </Span>
          )}
          {euro(fees.trainingCents)}
        </PaymentLine>
        <PaymentLine label={t("outlines", { count: fees.outlineCount })}>
          {euro(fees.outlineCents)}
        </PaymentLine>
        <PaymentLine label={t("total")} total>
          {euro(fees.trainingCents + fees.outlineCents)}
        </PaymentLine>
      </Box>
      <Text mt="4" fontSize="sm" color="fg.muted">
        {t("payHint")}
      </Text>
      <TransferDetails payment={props.payment} />
      <Box mt="4">
        <FormField label={t("payerName")} optionalLabel={t("optional")} help={t("payerNameHelp")}>
          <Input name="payer_name" defaultValue={props.payerName} autoComplete="off" bg="bg" />
        </FormField>
      </Box>
    </Box>
  );
}
