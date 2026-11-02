import { Box, Heading } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { RegistrationCards } from "./RegistrationCards";
import { RegistrationTable } from "./RegistrationTable";
import type { RegistrationRow, SetPaymentFlag } from "./types";

// Every registration: cards on phones, a table on wider screens.
export function RegistrationList(props: {
  rows: readonly RegistrationRow[];
  setPaymentFlag: SetPaymentFlag;
}) {
  const t = useTranslations("coordinator");
  return (
    <Box as="section" aria-labelledby="registrations-heading">
      <Heading as="h2" id="registrations-heading" size="xl" fontWeight="semibold">
        {t("registrations")}
      </Heading>
      <RegistrationCards {...props} />
      <RegistrationTable {...props} />
    </Box>
  );
}
