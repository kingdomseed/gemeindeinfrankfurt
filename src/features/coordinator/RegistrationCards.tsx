import { HStack, List, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { displayLanguages, displayName } from "./display";
import { PaymentStatus } from "./PaymentStatus";
import type { RegistrationRow, SetPaymentFlag } from "./types";

// Phones: one card per registration, with labelled payment toggles.
export function RegistrationCards(props: {
  rows: readonly RegistrationRow[];
  setPaymentFlag: SetPaymentFlag;
}) {
  const t = useTranslations("coordinator");
  return (
    <List.Root listStyle="none" mt="3" borderYWidth="1px" hideFrom="sm">
      {props.rows.map((row, i) => (
        <List.Item
          key={row.registration.id}
          display="block"
          py="3"
          borderTopWidth={i === 0 ? "0" : "1px"}
        >
          <Text fontWeight="semibold">{displayName(row)}</Text>
          {row.registration.payer_name && (
            <Text fontSize="sm">{t("payer", { name: row.registration.payer_name })}</Text>
          )}
          <Text fontSize="sm" color="fg.muted">
            {t(`seatShort.${row.registration.seat_type}`)} · {displayLanguages(row)}
          </Text>
          <HStack wrap="wrap" columnGap="6" mt="1">
            <PaymentStatus
              row={row}
              payment="fee"
              setPaymentFlag={props.setPaymentFlag}
              showLabel
            />
            <PaymentStatus
              row={row}
              payment="outline"
              setPaymentFlag={props.setPaymentFlag}
              showLabel
            />
          </HStack>
        </List.Item>
      ))}
    </List.Root>
  );
}
