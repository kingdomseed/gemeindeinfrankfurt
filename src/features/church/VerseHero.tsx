import { Box, Heading, Image, Text } from "@chakra-ui/react";
import NextImage from "next/image";

// The verse in large italic type over a dimmed photo of an open Bible, with
// the welcome as the page's h1 under it. The photo is public domain
// (Leon Brooks, Wikimedia Commons), so it needs no credit.
export function VerseHero(props: { verse: string; welcome: string }) {
  return (
    <Box
      position="relative"
      overflow="hidden"
      bg="gray.900"
      color="white"
      textAlign="center"
      px="6"
      py={{ base: "20", md: "28", lg: "32" }}
    >
      <Image asChild position="absolute" inset="0" w="full" h="full" objectFit="cover">
        <NextImage
          src="/hero-bible.jpg"
          alt=""
          fill
          sizes="100vw"
          fetchPriority="high"
          loading="eager"
        />
      </Image>
      <Box
        position="absolute"
        inset="0"
        bgGradient="to-b"
        gradientFrom="blackAlpha.600"
        gradientTo="blackAlpha.700"
      />
      <Box position="relative" maxW="4xl" mx="auto">
        {props.verse && (
          <Text
            fontFamily="heading"
            fontStyle="italic"
            fontSize={{ base: "4xl", sm: "5xl", md: "6xl", lg: "7xl" }}
            lineHeight="1.08"
            textWrap="balance"
          >
            {props.verse}
          </Text>
        )}
        <Heading
          as="h1"
          mt="5"
          fontFamily="body"
          fontWeight="normal"
          fontSize={{ base: "lg", md: "xl" }}
          color="whiteAlpha.900"
        >
          {props.welcome}
        </Heading>
      </Box>
    </Box>
  );
}
