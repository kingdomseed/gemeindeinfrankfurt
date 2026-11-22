import { Box, Container, Flex, Link, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import type { SiteSettings } from "@/lib/cms";

import { SectionHeading } from "./SectionHeading";

// The closing invitation to write to the church. The button appears once an
// address is set in the CMS.
export function ContactBox({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("site");
  return (
    <Container
      as="section"
      aria-labelledby="contact"
      maxW="6xl"
      px="4"
      py={{ base: "14", md: "22" }}
    >
      <Flex
        bg="bg.muted"
        rounded="2xl"
        px={{ base: "6", md: "12" }}
        py={{ base: "7", md: "10" }}
        align="center"
        justify="space-between"
        wrap="wrap"
        columnGap="10"
        rowGap="6"
      >
        <Box maxW="60ch">
          <SectionHeading id="contact">
            {settings.contactHeading || t("contactHeading")}
          </SectionHeading>
          {settings.contactIntro && (
            <Text mt="2" color="fg.muted">
              {settings.contactIntro}
            </Text>
          )}
        </Box>
        {settings.contactEmail && (
          <Link
            href={`mailto:${settings.contactEmail}`}
            minH="12"
            px="6"
            rounded="l2"
            bg="brand.solid"
            color="brand.contrast"
            fontWeight="semibold"
            textDecoration="none"
            _hover={{ bg: "brand.emphasized", color: "brand.contrast" }}
          >
            {t("writeToUs")}
          </Link>
        )}
      </Flex>
    </Container>
  );
}
