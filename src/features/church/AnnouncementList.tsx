import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

import type { Announcement } from "@/lib/cms";

import { PageBody } from "./PageBody";

// The latest announcements, newest first. Nothing is shown when there are none.
export function AnnouncementList(props: {
  heading: string;
  items: readonly Announcement[];
  pageHrefs: Record<string, string>;
}) {
  const t = useTranslations("site");
  const format = useFormatter();
  if (props.items.length === 0) return null;
  return (
    <Stack as="section" gap="4">
      <Heading as="h2" size="xl">
        {props.heading || t("announcements")}
      </Heading>
      <Stack as="ul" gap="3" listStyleType="none">
        {props.items.map((item) => (
          <Box
            as="li"
            key={item.id}
            borderWidth="1px"
            borderStartWidth="4px"
            borderStartColor="brand.solid"
            rounded="l2"
            p="4"
          >
            <Text fontSize="sm" color="fg.muted">
              <time dateTime={item.publishedAt.toISOString()}>
                {format.dateTime(item.publishedAt, { dateStyle: "long" })}
              </time>
            </Text>
            <Heading as="h3" size="md" mt="1">
              {item.title}
            </Heading>
            {item.body && (
              <Box mt="2">
                <PageBody content={item.body} pageHrefs={props.pageHrefs} />
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
