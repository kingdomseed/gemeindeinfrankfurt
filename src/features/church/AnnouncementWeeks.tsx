import { Accordion, Box, Span, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

import type { Announcement } from "@/lib/cms";
import { firstSectionHeadlines } from "@/lib/domain/rich-text";

import { PageBody } from "./PageBody";

const shownHeadlines = 3;

// A month's weekly announcements, folded: each shows its date, title and
// headlines, and opens to the whole announcement.
export function AnnouncementWeeks(props: {
  items: readonly Announcement[];
  pageHrefs: Record<string, string>;
}) {
  const t = useTranslations("site");
  const format = useFormatter();
  return (
    <Accordion.Root multiple collapsible variant="plain">
      {props.items.map((item) => {
        const headlines = firstSectionHeadlines(item.body);
        const more = headlines.length - shownHeadlines;
        return (
          <Accordion.Item
            key={item.id}
            value={item.id}
            borderWidth="1px"
            rounded="l2"
            mb="2"
            _open={{ borderColor: "border.emphasized" }}
          >
            <Accordion.ItemTrigger
              cursor="pointer"
              alignItems="flex-start"
              gap="4"
              px={{ base: "3", md: "4" }}
              py="3"
              rounded="l2"
              _hover={{ bg: "bg.subtle" }}
            >
              <Stack
                gap="0"
                align="center"
                justify="center"
                flexShrink="0"
                w="12"
                h="12"
                rounded="l2"
                bg="brand.subtle"
                color="brand.fg"
                aria-hidden="true"
              >
                <Span fontSize="lg" fontWeight="bold" lineHeight="1">
                  {format.dateTime(item.publishedAt, { day: "numeric" })}
                </Span>
                <Span fontSize="2xs" fontWeight="semibold" textTransform="uppercase">
                  {format.dateTime(item.publishedAt, { month: "short" })}
                </Span>
              </Stack>
              <Box flex="1" textAlign="start" minW="0">
                <Text fontWeight="semibold">{item.title}</Text>
                {headlines.length > 0 && (
                  <Text fontSize="sm" color="fg.muted" mt="0.5" lineClamp={{ base: 3, md: 2 }}>
                    {headlines.slice(0, shownHeadlines).join(" · ")}
                    {more > 0 && ` · ${t("moreHeadlines", { count: more })}`}
                  </Text>
                )}
              </Box>
              <Accordion.ItemIndicator mt="1" />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody px={{ base: "3", md: "4" }} pb="4" pt="1">
                {item.body && (
                  <Box css={{ "& h2": { fontSize: "lg", mt: "6" } }}>
                    <PageBody content={item.body} pageHrefs={props.pageHrefs} />
                  </Box>
                )}
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
