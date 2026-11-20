import { Box, Container, Flex, Link, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";
import type { NavPage } from "@/lib/cms";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { SiteNav } from "./SiteNav";

// Site name and tagline, the language switcher, and the main menu: the CMS
// pages in menu order, then the video training.
export function SiteHeader(props: {
  siteName: string;
  tagline: string;
  pages: readonly NavPage[];
}) {
  const t = useTranslations("site");
  const tc = useTranslations("common");
  const items = [
    ...props.pages.map((page) => ({
      href: page.isHome ? "/" : `/${page.slug}`,
      label: page.title,
    })),
    { href: "/training", label: t("training") },
  ];
  return (
    <Box as="header" borderBottomWidth="1px">
      <Container maxW="5xl" px="4" pt="4">
        <Flex wrap="wrap" align="flex-start" justify="space-between" columnGap="6" rowGap="1">
          <Stack gap="0" py="1">
            <Link
              asChild
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="semibold"
              color="fg"
              textDecoration="none"
              letterSpacing="tight"
            >
              <LocaleLink href="/">{props.siteName}</LocaleLink>
            </Link>
            {props.tagline && (
              <Text fontSize="sm" color="fg.muted">
                {props.tagline}
              </Text>
            )}
          </Stack>
          {/* On phones the switcher wraps under the site name; line its first link up with it. */}
          <Box ms={{ base: "-2", sm: "0" }}>
            <LanguageSwitcher label={tc("languageNav")} />
          </Box>
        </Flex>
        <SiteNav label={t("mainNav")} items={items} />
      </Container>
    </Box>
  );
}
