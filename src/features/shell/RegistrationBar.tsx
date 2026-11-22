"use client";

import { Box, Button, CloseButton, Container, Flex, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink, usePathname } from "@/i18n/navigation";

import { hiddenAttribute } from "./bannerStorage";

function dismiss(storageKey: string) {
  try {
    localStorage.setItem(storageKey, "dismissed");
  } catch {
    // Private windows may refuse storage; the bar still closes for this page.
  }
  document.documentElement.setAttribute(hiddenAttribute, "");
}

// Not shown on the training pages themselves, where it would only repeat them.
export function RegistrationBar(props: { storageKey: string; dates: string; closesDay: string }) {
  const t = useTranslations("site");
  const pathname = usePathname();
  if (pathname === "/training" || pathname.startsWith("/training/")) return null;
  return (
    <Box
      as="aside"
      aria-label={t("training")}
      bg="bg.muted"
      borderBottomWidth="1px"
      fontSize={{ base: "sm", md: "md" }}
      css={{ [`html[${hiddenAttribute}] &`]: { display: "none" } }}
    >
      <Container maxW="6xl" px="4">
        <Flex wrap={{ base: "wrap", md: "nowrap" }} align="center" columnGap="4" py="1.5">
          <Text flex="1" minW="0" flexBasis={{ base: "calc(100% - 3.25rem)", md: "auto" }}>
            <Text as="strong" fontWeight="semibold">
              {t("training")}
            </Text>
            {` · ${props.dates} · ${t("registrationOpen", { day: props.closesDay })}`}
          </Text>
          <Button
            asChild
            size="sm"
            rounded="full"
            px="5"
            order={{ base: 3, md: 0 }}
            flex={{ base: "1", md: "none" }}
            mb={{ base: "1.5", md: "0" }}
          >
            <LocaleLink href="/training">{t("registerNow")}</LocaleLink>
          </Button>
          <CloseButton
            size="lg"
            me="-3"
            color="fg.muted"
            aria-label={t("dismissBanner")}
            onClick={() => dismiss(props.storageKey)}
          />
        </Flex>
      </Container>
    </Box>
  );
}
