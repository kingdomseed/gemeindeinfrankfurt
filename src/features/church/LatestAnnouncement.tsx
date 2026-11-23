import { Box, Heading, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

import type { Announcement } from "@/lib/cms";

import { Eyebrow } from "./Eyebrow";
import { PageBody } from "./PageBody";

// The newest announcement, open in full at the top of the page.
export function LatestAnnouncement(props: {
  item: Announcement;
  pageHrefs: Record<string, string>;
}) {
  const t = useTranslations("site");
  const format = useFormatter();
  const { item } = props;
  return (
    <Box
      as="section"
      aria-labelledby="latest-announcement"
      borderWidth="1px"
      borderTopWidth="4px"
      borderTopColor="brand.solid"
      rounded="l3"
      bg="bg.subtle"
      p={{ base: "5", md: "7" }}
    >
      <Eyebrow>{t("latestAnnouncement")}</Eyebrow>
      <Heading as="h2" id="latest-announcement" size="2xl" mt="2" textWrap="balance">
        {item.title}
      </Heading>
      <Text fontSize="sm" color="fg.muted" mt="1">
        <time dateTime={item.publishedAt.toISOString()}>
          {format.dateTime(item.publishedAt, { dateStyle: "long" })}
        </time>
      </Text>
      {item.body && (
        <Box mt="5" css={{ "& h2": { fontSize: "xl" } }}>
          <PageBody content={item.body} pageHrefs={props.pageHrefs} />
        </Box>
      )}
    </Box>
  );
}
