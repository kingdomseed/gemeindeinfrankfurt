import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { focusOnMount } from "@/components/ui/focus";
import { formatEuro } from "@/lib/domain/fees";

import { TransferDetails } from "./TransferDetails";
import type { PaymentDetails } from "./types";

// Shown after a successful registration, so the transfer details stay on screen
// even if the confirmation email lands in spam.
export function Receipt(props: {
  totalCents: number;
  payment: PaymentDetails;
  onRegisterAnother: () => void;
}) {
  const t = useTranslations("register");
  const locale = useLocale();
  return (
    <Stack
      as="section"
      ref={focusOnMount}
      tabIndex={-1}
      gap="4"
      align="flex-start"
      rounded="xl"
      bg="bg.success"
      color="fg.success"
      p="5"
      outline="none"
    >
      <Heading as="h2" size="xl" fontWeight="semibold">
        {t("receiptTitle")}
      </Heading>
      <Text>{t("receiptBody")}</Text>
      {props.totalCents > 0 && (
        <Box alignSelf="stretch" rounded="lg" bg="bg" color="fg" p="4">
          <Text fontWeight="semibold">
            {t("receiptPay", { total: formatEuro(props.totalCents, locale) })}
          </Text>
          <TransferDetails payment={props.payment} />
        </Box>
      )}
      <Button
        variant="plain"
        px="0"
        color="inherit"
        fontWeight="semibold"
        textDecoration="underline"
        onClick={props.onRegisterAnother}
      >
        {t("registerAnother")}
      </Button>
    </Stack>
  );
}
