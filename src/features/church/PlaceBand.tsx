import { Link, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { openStreetMapUrl } from "@/lib/domain/maps";

import { PhotoBand } from "./PhotoBand";
import { SectionHeading } from "./SectionHeading";

// Where the church meets, beside a photo of the Nidda (Leonhard Lenz, CC0).
export function PlaceBand(props: { address: string; tinted: boolean }) {
  const t = useTranslations("site");
  return (
    <PhotoBand photo="/home-place.jpg" tinted={props.tinted} photoEnd={false} labelledBy="place">
      <SectionHeading id="place">{t("meetingPlace")}</SectionHeading>
      <Text as="address" fontStyle="normal" fontSize="xl" whiteSpace="pre-line">
        {props.address}
      </Text>
      <Link
        href={openStreetMapUrl(props.address)}
        minH="12"
        px="5"
        rounded="l2"
        borderWidth="1.5px"
        borderColor="brand.solid"
        color="brand.fg"
        fontWeight="semibold"
        textDecoration="none"
        _hover={{ bg: "brand.subtle" }}
      >
        {t("openMap")}
      </Link>
    </PhotoBand>
  );
}
