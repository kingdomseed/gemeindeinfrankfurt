import { Box, Container, Flex, Link, Text } from "@chakra-ui/react";
import { useNow, useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";

export function SiteFooter({ siteName }: { siteName: string }) {
  const t = useTranslations("site");
  const tc = useTranslations("common");
  const year = useNow().getFullYear();
  return (
    <Box as="footer" borderTopWidth="1px">
      <Container maxW="5xl" px="4" py="6">
        <Flex wrap="wrap" columnGap="6" rowGap="1" fontSize="sm" color="fg.muted">
          <Text>{t("copyright", { year, siteName })}</Text>
          <Link asChild color="inherit" textDecoration="underline">
            <LocaleLink href="/privacy">{tc("privacy")}</LocaleLink>
          </Link>
        </Flex>
      </Container>
    </Box>
  );
}
