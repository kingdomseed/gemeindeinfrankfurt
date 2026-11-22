import { Box, Container, Heading, Image, Link, Text } from "@chakra-ui/react";
import NextImage from "next/image";

import { Link as LocaleLink } from "@/i18n/navigation";

// The verse and the welcome over a dimmed photo of an open Bible, with one
// button to the page for visitors. The photo is public domain (Leon Brooks,
// Wikimedia Commons), so it needs no credit.
export function HomeHero(props: {
  verse: string;
  welcome: string;
  action: { href: string; label: string } | null;
}) {
  return (
    <Box position="relative" overflow="hidden" bg="gray.900" color="white">
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
        bgGradient="to-r"
        gradientFrom="blackAlpha.800"
        gradientVia="blackAlpha.500"
        gradientTo="blackAlpha.300"
      />
      <Container
        position="relative"
        maxW="6xl"
        px="4"
        minH={{ base: "md", md: "min(72vh, 600px)" }}
        py={{ base: "14", md: "18" }}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="flex-start"
        gap="4"
      >
        {props.verse && (
          <Text fontFamily="heading" fontStyle="italic" fontSize={{ base: "lg", md: "xl" }}>
            {props.verse}
          </Text>
        )}
        <Heading
          as="h1"
          fontFamily="heading"
          fontWeight="medium"
          fontSize={{ base: "4xl", sm: "5xl", lg: "6xl" }}
          lineHeight="1.08"
          maxW="15ch"
          textWrap="balance"
        >
          {props.welcome}
        </Heading>
        {props.action && (
          <Link
            asChild
            mt="2"
            minH="12"
            px="6"
            rounded="l2"
            bg="bronze.dark"
            color="bronze.inkDark"
            fontWeight="semibold"
            textDecoration="none"
            _hover={{ bg: "bronze.darkHover", color: "bronze.inkDark" }}
          >
            <LocaleLink href={props.action.href}>{props.action.label}</LocaleLink>
          </Link>
        )}
      </Container>
    </Box>
  );
}
