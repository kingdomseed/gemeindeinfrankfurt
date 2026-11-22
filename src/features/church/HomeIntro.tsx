import { Box, Container, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { splitFirstSentence } from "@/lib/domain/rich-text";

import { Eyebrow } from "./Eyebrow";
import { SectionHeading } from "./SectionHeading";

// The home page's opening paragraph: its first sentence as the heading, the
// rest beside it.
export function HomeIntro(props: { title: string; text: string }) {
  const { head, rest } = splitFirstSentence(props.text);
  return (
    <Container as="section" aria-labelledby="intro" maxW="6xl" px="4" py={{ base: "14", md: "22" }}>
      <SimpleGrid
        templateColumns={{ base: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" }}
        gap={{ base: "6", md: "12" }}
        alignItems="start"
      >
        <Stack gap="2.5">
          <Eyebrow>{props.title}</Eyebrow>
          <SectionHeading id="intro">{head}</SectionHeading>
        </Stack>
        {rest && (
          <Box>
            <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }} lineHeight="tall">
              {rest}
            </Text>
          </Box>
        )}
      </SimpleGrid>
    </Container>
  );
}
