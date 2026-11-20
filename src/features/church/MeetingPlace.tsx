import { Box, Heading, Link, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { openStreetMapUrl } from "@/lib/domain/maps";

// Where the church meets, with a link to the map.
export function MeetingPlace({ heading, address }: { heading: string; address: string }) {
  const t = useTranslations("site");
  return (
    <Box as="section" bg="brand.subtle" rounded="l3" p="5">
      <Heading as="h2" size="md">
        {heading || t("meetingPlace")}
      </Heading>
      <Text as="address" fontStyle="normal" fontSize="lg" mt="1">
        {address}
      </Text>
      <Link href={openStreetMapUrl(address)} color="brand.fg" textDecoration="underline" mt="2">
        {t("openMap")}
      </Link>
    </Box>
  );
}
