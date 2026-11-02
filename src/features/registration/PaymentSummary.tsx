import { Box, Flex, Heading, Input, Span, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormField } from "@/components/ui/form-field";
import { formatEuro, type FeeBreakdown } from "@/lib/domain/fees";

import { TransferDetails } from "./TransferDetails";
import type { PaymentDetails } from "./types";

function Line(props: { label: ReactNode; children: ReactNode; total?: boolean }) {
  return (
    <Flex
      as="div"
      justify="space-between"
      align="baseline"
      gap="6"
      fontVariantNumeric="tabular-nums"
      {...(props.total && {
        mt: "2",
        pt: "2",
        borderTopWidth: "1px",
        borderColor: "border.emphasized",
        fontWeight: "semibold",
      })}
    >
      <dt>{props.label}</dt>
      <Box as="dd" textAlign="right" fontSize={props.total ? "lg" : undefined}>
        {props.children}
      </Box>
    </Flex>
  );
}

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
        <Line label={t("trainingFee")}>
          {fees.waived && (
            <Span fontSize="sm" color="fg.muted">
              {t("waived")}{" "}
            </Span>
          )}
          {euro(fees.trainingCents)}
        </Line>
        <Line label={t("outlines", { count: fees.outlineCount })}>{euro(fees.outlineCents)}</Line>
        <Line label={t("total")} total>
          {euro(fees.trainingCents + fees.outlineCents)}
        </Line>
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
