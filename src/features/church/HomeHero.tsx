import { Box, Container, Heading, Image, Link, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import NextImage from "next/image";

import { Link as LocaleLink } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Credit = { author: string; licence: string; source: string; licenceUrl: string };

// An open Bible in each site's language. German: Hanna Theresia Pitter,
// Unsplash License; English: Leon Brooks, public domain. Only the Russian
// photo's licence asks for a credit.
const photos: Record<Locale, { src: string; credit: Credit | null }> = {
  de: { src: "/hero-bible-de.jpg", credit: null },
  en: { src: "/hero-bible.jpg", credit: null },
  ru: {
    src: "/hero-bible-ru.jpg",
    credit: {
      author: "Dmitry Makeev",
      licence: "CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Russian_bibles._1896_year._img_05.jpg",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
  },
};

// The verse and the welcome over a dimmed photo of an open Bible, with one
// button to the page for visitors.
export function HomeHero(props: {
  verse: string;
  welcome: string;
  action: { href: string; label: string } | null;
}) {
  const t = useTranslations("site");
  const photo = photos[useLocale()];
  return (
    <Box position="relative" overflow="hidden" bg="gray.900" color="white">
      <Image asChild position="absolute" inset="0" w="full" h="full" objectFit="cover">
        <NextImage src={photo.src} alt="" fill sizes="100vw" fetchPriority="high" loading="eager" />
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
      {photo.credit && (
        <Text position="absolute" right="3" bottom="2" fontSize="xs" color="whiteAlpha.800">
          <Link href={photo.credit.source} color="inherit">
            {t("photoBy", { author: photo.credit.author })}
          </Link>
          {", "}
          <Link href={photo.credit.licenceUrl} color="inherit">
            {photo.credit.licence}
          </Link>
        </Text>
      )}
    </Box>
  );
}
