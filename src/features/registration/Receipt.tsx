import { Box, Button, Heading, List, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { focusOnMount } from "@/components/ui/focus";
import { formatEuro } from "@/lib/domain/fees";

import { TransferDetails } from "./TransferDetails";
import type { PaymentDetails } from "./types";

const nextSteps = ["nextPaid", "nextBefore", "nextChange"] as const;

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
    <Stack gap="10" align="flex-start">
      <Stack
        as="section"
        ref={focusOnMount}
        tabIndex={-1}
        gap="4"
        alignSelf="stretch"
        rounded="xl"
        bg="bg.success"
        color="fg.success"
        p="5"
        outline="none"
      >
        <Stack gap="1">
          <Text fontSize="lg" fontWeight="medium">
            {t("receiptThanks")}
          </Text>
          <Heading as="h2" size="xl">
            {t("receiptTitle")}
          </Heading>
        </Stack>
        <Text>{t("receiptBody")}</Text>
        {props.totalCents > 0 && (
          <Box rounded="lg" bg="bg" color="fg" p="4">
            <Text fontWeight="semibold" fontVariantNumeric="tabular-nums">
              {t("receiptPay", { total: formatEuro(props.totalCents, locale) })}
            </Text>
            <TransferDetails payment={props.payment} />
          </Box>
        )}
      </Stack>
      <Box as="section" aria-labelledby="next-heading">
        <Heading as="h2" id="next-heading" size="xl">
          {t("nextTitle")}
        </Heading>
        <List.Root as="ol" mt="3" ps="5" gap="2">
          {nextSteps.map((key) => (
            <List.Item key={key}>{t(key)}</List.Item>
          ))}
        </List.Root>
      </Box>
      <Button variant="outline" px="6" onClick={props.onRegisterAnother}>
        {t("registerAnother")}
      </Button>
    </Stack>
  );
}
