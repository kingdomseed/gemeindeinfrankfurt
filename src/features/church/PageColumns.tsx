import { Box, Container, Flex, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";

import type { PageContent, SiteSettings } from "@/lib/cms";

import { ContactPanel } from "./ContactPanel";
import { PageBlocks } from "./PageBlocks";
import { PageBody } from "./PageBody";

// The page text with the contact panel beside it on wide screens and below
// it on narrow ones.
export function PageColumns(props: {
  heading: ReactNode;
  page: PageContent;
  settings: SiteSettings;
}) {
  const { page, settings } = props;
  return (
    <Container maxW="6xl" px="4" pt={{ base: "8", md: "14" }} pb="16">
      <Flex
        direction={{ base: "column", lg: "row" }}
        align="flex-start"
        gap={{ base: "10", lg: "14" }}
      >
        <Stack as="article" flex="1" minW="0" gap="6">
          {props.heading}
          {page.blocks.length > 0 ? (
            <PageBlocks
              blocks={page.blocks}
              pageHrefs={page.pageHrefs}
              meetingAddress={settings.meetingAddress}
            />
          ) : (
            page.body && (
              <Box maxW="prose">
                <PageBody content={page.body} pageHrefs={page.pageHrefs} />
              </Box>
            )
          )}
        </Stack>
        <ContactPanel settings={settings} />
      </Flex>
    </Container>
  );
}
