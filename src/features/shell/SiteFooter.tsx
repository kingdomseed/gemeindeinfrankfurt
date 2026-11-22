import { Box, Container, Flex, Grid, Heading, Link, List, Stack, Text } from "@chakra-ui/react";
import { useNow, useTranslations } from "next-intl";

import { ColorModeButton } from "@/components/ui/color-mode-button";
import { Link as LocaleLink } from "@/i18n/navigation";
import type { NavPage, SiteSettings } from "@/lib/cms";
import { openStreetMapUrl } from "@/lib/domain/maps";

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  minH: "11",
  color: "fg.muted",
  textDecoration: "underline",
  textDecorationColor: "border.emphasized",
  _hover: { color: "fg", textDecorationColor: "currentColor" },
} as const;

// The site's name and verse, where and how to reach the church, the pages
// for visitors and for members, and the legal links.
export function SiteFooter(props: { settings: SiteSettings; pages: readonly NavPage[] }) {
  const t = useTranslations("site");
  const tc = useTranslations("common");
  const year = useNow().getFullYear();
  const { settings } = props;
  const pages = props.pages.map((page) => ({
    href: page.isHome ? "/" : `/${page.slug}`,
    label: page.title,
  }));
  const members = [
    { href: "/announcements", label: t("announcementsTitle") },
    { href: "/events", label: t("eventsTitle") },
    { href: "/training", label: t("training") },
  ];
  return (
    <Box as="footer" bg="bg.subtle" borderTopWidth="1px" _print={{ display: "none" }}>
      <Container maxW="6xl" px="4" pt={{ base: "10", md: "12" }} pb="4">
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "1.3fr repeat(4, minmax(0, 1fr))",
          }}
          columnGap="10"
          rowGap="8"
        >
          <Stack gap="2">
            <Text fontFamily="heading" fontSize="xl" lineHeight="1.25">
              {settings.siteName}
            </Text>
            {settings.tagline && (
              <Text fontFamily="heading" fontStyle="italic" color="fg.muted">
                {settings.tagline}
              </Text>
            )}
          </Stack>
          <Stack gap="1">
            <Heading as="h2" size="sm" fontFamily="body">
              {t("meetingPlace")}
            </Heading>
            <Text as="address" fontStyle="normal" color="fg.muted">
              {settings.meetingAddress}
            </Text>
            <Link href={openStreetMapUrl(settings.meetingAddress)} {...linkStyle}>
              {t("openMap")}
            </Link>
          </Stack>
          <Stack gap="1">
            <Heading as="h2" size="sm" fontFamily="body">
              {settings.contactHeading || t("contactHeading")}
            </Heading>
            {settings.contactIntro && <Text color="fg.muted">{settings.contactIntro}</Text>}
            {settings.contactEmail && (
              <Link href={`mailto:${settings.contactEmail}`} overflowWrap="anywhere" {...linkStyle}>
                {settings.contactEmail}
              </Link>
            )}
          </Stack>
          <FooterLinks id="footer-pages" heading={t("footerPages")} links={pages} />
          <FooterLinks id="footer-members" heading={t("members")} links={members} />
        </Grid>
        <Flex
          wrap="wrap"
          align="center"
          columnGap="6"
          mt="8"
          pt="2"
          borderTopWidth="1px"
          fontSize="sm"
          color="fg.muted"
        >
          <Text me="auto" py="3">
            {t("copyright", { year, siteName: settings.siteName })}
          </Text>
          <Link asChild {...linkStyle}>
            <LocaleLink href="/privacy">{tc("privacy")}</LocaleLink>
          </Link>
          <Link asChild {...linkStyle}>
            <LocaleLink href="/impressum">{tc("imprint")}</LocaleLink>
          </Link>
          <ColorModeButton toDark={tc("darkMode")} toLight={tc("lightMode")} />
        </Flex>
      </Container>
    </Box>
  );
}

function FooterLinks(props: {
  id: string;
  heading: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <Box as="nav" aria-labelledby={props.id}>
      <Heading as="h2" id={props.id} size="sm" fontFamily="body" mb="1">
        {props.heading}
      </Heading>
      <List.Root listStyle="none" gap="0">
        {props.links.map((link) => (
          <List.Item key={link.href}>
            <Link asChild {...linkStyle} textDecoration="none">
              <LocaleLink href={link.href}>{link.label}</LocaleLink>
            </Link>
          </List.Item>
        ))}
      </List.Root>
    </Box>
  );
}
