import { Box, Container, Flex, Stack } from "@chakra-ui/react";

import { PageHeading } from "@/components/ui/page-heading";
import type { PageContent, SiteSettings } from "@/lib/cms";

import { ContactPanel } from "./ContactPanel";
import { HeaderPhoto } from "./HeaderPhoto";
import { PageBlocks } from "./PageBlocks";
import { PageBody } from "./PageBody";

// A public church page: the header photo, then the page text with the
// contact panel beside it on wide screens and below it on narrow ones.
export function ChurchPage({ page, settings }: { page: PageContent; settings: SiteSettings }) {
  return (
    <>
      <HeaderPhoto />
      <Container as="main" maxW="5xl" px="4" pt={{ base: "6", md: "10" }} pb="16">
        <Flex
          direction={{ base: "column", lg: "row" }}
          align="flex-start"
          gap={{ base: "10", lg: "12" }}
        >
          <Stack as="article" flex="1" minW="0" gap="8">
            <PageHeading title={page.title} />
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
    </>
  );
}
