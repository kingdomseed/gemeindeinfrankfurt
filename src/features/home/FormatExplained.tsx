import { Box, Heading, Stack } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

// How the training runs during the week vs. on the weekend, with the active attendance locations.
export function FormatExplained({ siteNames }: { siteNames: readonly string[] }) {
  const t = useTranslations("home");
  const format = useFormatter();
  const sites = siteNames.length > 0 ? format.list(siteNames, { type: "disjunction" }) : null;
  return (
    <Box as="section" aria-labelledby="format-heading">
      <Heading as="h2" id="format-heading" size="xl">
        {t("formatTitle")}
      </Heading>
      <Stack as="dl" gap="4" mt="3">
        <Stack gap="0.5">
          <Box as="dt" fontWeight="medium">
            {t("formatWeekdaysTitle")}
          </Box>
          <Box as="dd" color="fg.muted">
            {t("formatWeekdaysBody")}
          </Box>
        </Stack>
        <Stack gap="0.5">
          <Box as="dt" fontWeight="medium">
            {t("formatWeekendsTitle")}
          </Box>
          <Box as="dd" color="fg.muted">
            {sites ? t("formatWeekendsBody", { sites }) : t("formatWeekendsBodyNoSites")}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
