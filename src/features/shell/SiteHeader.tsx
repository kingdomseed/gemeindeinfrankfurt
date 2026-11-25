import { Box, Container, Link } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";
import type { NavPage } from "@/lib/cms";

import { HeaderMenu } from "./HeaderMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

// A bronze rule on top, the site name, and the menu: the CMS pages for
// visitors, then "Mitglieder" with the pages for members of the church.
export function SiteHeader(props: { siteName: string; pages: readonly NavPage[] }) {
  const t = useTranslations("site");
  const tc = useTranslations("common");
  const items = props.pages.map((page) => ({
    href: page.isHome ? "/" : `/${page.slug}`,
    label: page.title,
  }));
  const members = [
    { href: "/announcements", label: t("announcementsTitle") },
    { href: "/events", label: t("eventsTitle") },
    { href: "/training", label: t("training") },
  ];
  return (
    <Box
      as="header"
      bg="bg"
      borderTopWidth="6px"
      borderTopColor="brand.solid"
      borderBottomWidth="1px"
      _print={{ display: "none" }}
    >
      <Container maxW="6xl">
        <HeaderMenu
          brand={
            <Link
              asChild
              minH="11"
              minW="0"
              fontFamily="heading"
              fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
              lineHeight="1.2"
              color="fg"
              textDecoration="none"
              _hover={{ color: "fg" }}
            >
              <LocaleLink href="/">{props.siteName}</LocaleLink>
            </Link>
          }
          languages={<LanguageSwitcher label={tc("languageNav")} />}
          items={items}
          members={members}
          labels={{
            nav: t("mainNav"),
            menu: t("menu"),
            close: t("closeMenu"),
            members: t("members"),
          }}
        />
      </Container>
    </Box>
  );
}
