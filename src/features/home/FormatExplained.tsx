import { Box, Heading, Stack } from "@chakra-ui/react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { capitalized } from "@/lib/domain/announcements";
import { sessionFormatDays } from "@/lib/domain/sessions";

// Which days meet online vs. in person, derived from the training's schedule
// and configured attendance locations.
export function FormatExplained(props: {
  sessions: readonly { starts_at: string; is_online: boolean }[];
  siteNames: readonly string[];
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const format = useFormatter();
  const { onlineDays, inPersonDays } = sessionFormatDays(props.sessions, locale, t("lordsDay"));
  if (onlineDays.length === 0 && inPersonDays.length === 0) return null;
  const sites =
    props.siteNames.length > 0 ? format.list(props.siteNames, { type: "disjunction" }) : null;

  return (
    <Box as="section" aria-labelledby="format-heading">
      <Heading as="h2" id="format-heading" size="xl">
        {t("formatTitle")}
      </Heading>
      <Stack as="dl" gap="4" mt="3">
        {onlineDays.length > 0 && (
          <Stack gap="0.5">
            <Box as="dt" fontWeight="medium">
              {capitalized(format.list(onlineDays, { type: "conjunction" }), locale)}
            </Box>
            <Box as="dd" color="fg.muted">
              {t("formatOnlineBody")}
            </Box>
          </Stack>
        )}
        {inPersonDays.length > 0 && (
          <Stack gap="0.5">
            <Box as="dt" fontWeight="medium">
              {capitalized(format.list(inPersonDays, { type: "conjunction" }), locale)}
            </Box>
            <Box as="dd" color="fg.muted">
              {sites ? t("formatInPersonBody", { sites }) : t("formatInPersonBodyNoSites")}
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
