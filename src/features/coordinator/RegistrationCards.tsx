import { HStack, List, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { formatEuro } from "@/lib/domain/fees";
import { openCents } from "@/lib/domain/payments";

import { displayLanguages } from "./display";
import { PaymentTag } from "./PaymentTag";
import { RegistrationName } from "./RegistrationName";
import type { RegistrationRow } from "./types";

// Phones: one card per registration.
export function RegistrationCards({ rows }: { rows: readonly RegistrationRow[] }) {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  return (
    <List.Root listStyle="none" borderYWidth="1px" hideFrom="sm">
      {rows.map((row, i) => (
        <List.Item
          key={row.registration.id}
          display="block"
          py="3"
          borderTopWidth={i === 0 ? "0" : "1px"}
        >
          <RegistrationName row={row} />
          <Text fontSize="sm" color="fg.muted">
            {t(`seatShort.${row.registration.seat_type}`)} · {displayLanguages(row.registration)}
            {" · "}
            {t("toPay")}: {formatEuro(openCents(row.registration, row.fees), locale)}
          </Text>
          <HStack wrap="wrap" columnGap="4" rowGap="1" mt="2" fontSize="sm">
            <Text as="span">{t("donation")}</Text>
            <PaymentTag row={row} payment="fee" />
            <Text as="span">{t("outlines")}</Text>
            <PaymentTag row={row} payment="outline" />
          </HStack>
        </List.Item>
      ))}
    </List.Root>
  );
}
