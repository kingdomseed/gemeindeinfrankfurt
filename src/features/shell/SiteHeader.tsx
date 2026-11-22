import { Box, Container, Grid, Link } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";
import type { NavPage } from "@/lib/cms";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { MainMenu } from "./MainMenu";

// Site name, the main menu (the CMS pages in menu order) and the language
// switcher in one row. On phones the menu takes its own row under them.
export function SiteHeader(props: { siteName: string; pages: readonly NavPage[] }) {
  const t = useTranslations("site");
  const tc = useTranslations("common");
  const items = props.pages.map((page) => ({
    href: page.isHome ? "/" : `/${page.slug}`,
    label: page.title,
  }));
  return (
    <Box as="header" borderBottomWidth="1px">
      <Container maxW="6xl" px="4">
        <Grid
          templateColumns={{ base: "minmax(0, 1fr) auto", md: "minmax(0, 1fr) auto auto" }}
          templateAreas={{ base: `"brand lang" "nav nav"`, md: `"brand nav lang"` }}
          alignItems="center"
          columnGap={{ base: "2", md: "5" }}
          minH={{ md: "16" }}
          pt={{ base: "2.5", md: "2" }}
          pb={{ md: "2" }}
        >
          <Link
            asChild
            gridArea="brand"
            justifySelf="start"
            minH="11"
            fontFamily="heading"
            fontSize={{ base: "lg", md: "xl" }}
            lineHeight="1.25"
            color="fg"
            textDecoration="none"
          >
            <LocaleLink href="/">{props.siteName}</LocaleLink>
          </Link>
          <MainMenu label={t("mainNav")} items={items} />
          <LanguageSwitcher label={tc("languageNav")} />
        </Grid>
      </Container>
    </Box>
  );
}
