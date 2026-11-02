import { Box, Heading, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { seatTypes } from "@/lib/domain/types";

// What each seat type means, before someone has to choose one on the form.
export function SeatsExplained() {
  const t = useTranslations("home");
  return (
    <Box as="section" aria-labelledby="seats-heading">
      <Heading as="h2" id="seats-heading" size="xl">
        {t("seatsTitle")}
      </Heading>
      <Stack as="dl" gap="4" mt="3">
        {seatTypes.map((seat) => (
          <Stack key={seat} gap="0.5">
            <Box as="dt" fontWeight="medium">
              {t(`seatInfo.${seat}.title`)}
            </Box>
            <Box as="dd" color="fg.muted">
              {t(`seatInfo.${seat}.body`)}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
