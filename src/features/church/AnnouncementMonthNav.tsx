import { Flex, Link, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { capitalized, midMonth, monthAnchor } from "@/lib/domain/announcements";

// A row of links to each month on the page, under the year they belong to.
export function AnnouncementMonthNav(props: { months: readonly { month: string }[] }) {
  const t = useTranslations("site");
  const format = useFormatter();
  const locale = useLocale();
  const years = [...new Set(props.months.map((group) => group.month.slice(0, 4)))];
  return (
    <Stack as="nav" aria-label={t("announcementMonths")} gap="2">
      {years.map((year) => (
        <Flex key={year} align="center" wrap="wrap" gap="2">
          {years.length > 1 && (
            <Text fontSize="sm" fontWeight="semibold" color="fg.muted" minW="12">
              {year}
            </Text>
          )}
          {props.months
            .filter((group) => group.month.startsWith(year))
            .map((group) => (
              <Link
                key={group.month}
                href={`#${monthAnchor(group.month)}`}
                borderWidth="1px"
                borderColor="border.emphasized"
                rounded="full"
                px="3.5"
                minH="10"
                display="inline-flex"
                alignItems="center"
                fontSize="sm"
                fontWeight="medium"
                textDecoration="none"
                _hover={{ bg: "brand.subtle", borderColor: "brand.border" }}
              >
                {capitalized(format.dateTime(midMonth(group.month), { month: "short" }), locale)}
              </Link>
            ))}
        </Flex>
      ))}
    </Stack>
  );
}
