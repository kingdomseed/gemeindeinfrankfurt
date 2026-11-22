import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useFormatter } from "next-intl";

import type { Announcement } from "@/lib/cms";

import { PageBody } from "./PageBody";

export type AnnouncementItems = {
  items: readonly Announcement[];
  pageHrefs: Record<string, string>;
};

// Announcements as cards, in the order given.
export function AnnouncementCards(props: AnnouncementItems) {
  const format = useFormatter();
  return (
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
  );
}
