import { Table, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { ColumnHeader } from "@/components/ui/column-header";

import { displayLanguages, displayName } from "./display";
import { PaymentStatus } from "./PaymentStatus";
import type { RegistrationRow, SetPaymentFlag } from "./types";

// Wider screens: one table row per registration.
export function RegistrationTable(props: {
  rows: readonly RegistrationRow[];
  setPaymentFlag: SetPaymentFlag;
}) {
  const t = useTranslations("coordinator");
  return (
    <Table.ScrollArea mt="3" hideBelow="sm">
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row bg="transparent">
            <ColumnHeader>{t("name")}</ColumnHeader>
            <ColumnHeader>{t("seat")}</ColumnHeader>
            <ColumnHeader>{t("languages")}</ColumnHeader>
            <ColumnHeader>{t("feePaid")}</ColumnHeader>
            <ColumnHeader>{t("outlinePaid")}</ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {props.rows.map((row) => (
            <Table.Row key={row.registration.id} bg="transparent">
              <Table.Cell as="th" scope="row" fontWeight="normal" py="1">
                {displayName(row)}
                {row.registration.payer_name && (
                  <Text as="span" display="block" fontSize="xs" color="fg.muted">
                    {t("payer", { name: row.registration.payer_name })}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell py="1">{t(`seatShort.${row.registration.seat_type}`)}</Table.Cell>
              <Table.Cell py="1" fontVariantNumeric="tabular-nums">
                {displayLanguages(row)}
              </Table.Cell>
              <Table.Cell py="0">
                <PaymentStatus row={row} payment="fee" setPaymentFlag={props.setPaymentFlag} />
              </Table.Cell>
              <Table.Cell py="0">
                <PaymentStatus row={row} payment="outline" setPaymentFlag={props.setPaymentFlag} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
