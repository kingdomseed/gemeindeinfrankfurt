import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import type { SiteSettings } from "@/lib/cms";
import { openStreetMapUrl } from "@/lib/domain/maps";

// The old site's sidebar: how to get in touch, and where the church meets.
// The email link appears only once an address is set in the CMS.
export function ContactPanel({ settings }: { settings: SiteSettings }) {
  const t = useTranslations("site");
  return (
    <Box
      as="aside"
      aria-labelledby="contact-heading"
      w={{ base: "full", lg: "xs" }}
      flexShrink="0"
      bg="bg.subtle"
      borderWidth="1px"
      rounded="l3"
      p="5"
    >
      <Stack gap="4">
        <Heading as="h2" id="contact-heading" size="lg">
          {settings.contactHeading || t("contactHeading")}
        </Heading>
        {settings.contactIntro && <Text>{settings.contactIntro}</Text>}
        {settings.contactEmail && (
          <Link
            href={`mailto:${settings.contactEmail}`}
            color="brand.fg"
            textDecoration="underline"
            overflowWrap="anywhere"
          >
            {settings.contactEmail}
          </Link>
        )}
        <Stack gap="1">
          <Text fontWeight="semibold">{t("meetingPlace")}</Text>
          <Text as="address" fontStyle="normal">
            {settings.meetingAddress}
          </Text>
          <Link
            href={openStreetMapUrl(settings.meetingAddress)}
            color="brand.fg"
            textDecoration="underline"
          >
            {t("openMap")}
          </Link>
        </Stack>
      </Stack>
    </Box>
  );
}
