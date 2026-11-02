import { Grid, HStack, Span } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/ui/copy-button";
import { DetailItem } from "@/components/ui/detail-item";

import type { PaymentDetails } from "./types";

// Payee, IBAN and reference, with copy buttons for the two that get pasted.
export function TransferDetails({ payment }: { payment: PaymentDetails }) {
  const t = useTranslations("register");
  const copy = { label: t("copy"), copiedLabel: t("copied") };
  return (
    <Grid
      as="dl"
      mt="2"
      templateColumns={{ base: "1fr", sm: "auto 1fr" }}
      columnGap="6"
      rowGap="2"
      alignItems="center"
    >
      <DetailItem label={t("payee")}>{payment.payee}</DetailItem>
      <DetailItem label={t("iban")}>
        <HStack wrap="wrap" columnGap="3">
          <Span fontFamily="mono" fontVariantNumeric="tabular-nums" userSelect="all">
            {payment.iban}
          </Span>
          <CopyButton value={payment.iban.replaceAll(/\s/g, "")} {...copy} />
        </HStack>
      </DetailItem>
      <DetailItem label={t("reference")}>
        <HStack wrap="wrap" columnGap="3">
          <Span userSelect="all">{payment.reference}</Span>
          <CopyButton value={payment.reference} {...copy} />
        </HStack>
      </DetailItem>
    </Grid>
  );
}
