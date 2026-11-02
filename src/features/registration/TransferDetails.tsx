import { Box, Grid, HStack, Span } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/ui/copy-button";

import type { PaymentDetails } from "./types";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <Box as="dt" fontSize="sm" color="fg.muted">
        {label}
      </Box>
      <Box as="dd">{children}</Box>
    </>
  );
}

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
      <Detail label={t("payee")}>{payment.payee}</Detail>
      <Detail label={t("iban")}>
        <HStack wrap="wrap" columnGap="3">
          <Span fontFamily="mono" fontVariantNumeric="tabular-nums" userSelect="all">
            {payment.iban}
          </Span>
          <CopyButton value={payment.iban.replaceAll(/\s/g, "")} {...copy} />
        </HStack>
      </Detail>
      <Detail label={t("reference")}>
        <HStack wrap="wrap" columnGap="3">
          <Span userSelect="all">{payment.reference}</Span>
          <CopyButton value={payment.reference} {...copy} />
        </HStack>
      </Detail>
    </Grid>
  );
}
