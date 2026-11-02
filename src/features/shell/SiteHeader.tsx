import { Container, Flex, Link } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";

import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader() {
  const t = useTranslations("common");
  return (
    <Container as="header" maxW="3xl" px="4" py="3">
      <Flex wrap="wrap" align="center" justify="space-between" columnGap="4">
        <Link asChild fontWeight="semibold" color="fg" textDecoration="none">
          <LocaleLink href="/">{t("appName")}</LocaleLink>
        </Link>
        <LanguageSwitcher label={t("languageNav")} />
      </Flex>
    </Container>
  );
}
