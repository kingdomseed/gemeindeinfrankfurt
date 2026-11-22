import { Box, Container, Image, SimpleGrid, Stack } from "@chakra-ui/react";
import NextImage from "next/image";
import type { ReactNode } from "react";

// A section with a photo on one side and its text on the other, stacked on
// phones with the photo first. Bands alternate tint and side down the page.
export function PhotoBand(props: {
  photo: string;
  tinted: boolean;
  photoEnd: boolean;
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <Box
      as="section"
      aria-labelledby={props.labelledBy}
      bg={props.tinted ? "bg.subtle" : undefined}
      py={{ base: "14", md: "22" }}
    >
      <Container maxW="6xl" px="4">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: "6", md: "14" }} alignItems="center">
          <Box
            position="relative"
            aspectRatio="4 / 3"
            overflow="hidden"
            rounded="l3"
            order={{ md: props.photoEnd ? 2 : 0 }}
          >
            <Image asChild objectFit="cover">
              <NextImage src={props.photo} alt="" fill sizes="(min-width: 768px) 560px, 100vw" />
            </Image>
          </Box>
          <Stack gap="4" align="flex-start">
            {props.children}
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
