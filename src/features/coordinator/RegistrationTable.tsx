import { Table } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { ColumnHeader } from "@/components/ui/column-header";
import { formatEuro } from "@/lib/domain/fees";
import { openCents } from "@/lib/domain/payments";

import { displayLanguages } from "./display";
import { PaymentTag } from "./PaymentTag";
import { RegistrationName } from "./RegistrationName";
import type { RegistrationRow } from "./types";

// Wider screens: one table row per registration.
export function RegistrationTable({ rows }: { rows: readonly RegistrationRow[] }) {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  return (
    <Table.ScrollArea hideBelow="sm">
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row bg="transparent">
            <ColumnHeader>{t("name")}</ColumnHeader>
            <ColumnHeader>{t("seat")}</ColumnHeader>
            <ColumnHeader>{t("locality")}</ColumnHeader>
            <ColumnHeader>{t("languages")}</ColumnHeader>
            <ColumnHeader align="end">{t("toPay")}</ColumnHeader>
            <ColumnHeader>{t("donation")}</ColumnHeader>
            <ColumnHeader>{t("outlines")}</ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row.registration.id} bg="transparent">
              <Table.Cell as="th" scope="row" fontWeight="normal">
                <RegistrationName row={row} />
              </Table.Cell>
              <Table.Cell>{t(`seatShort.${row.registration.seat_type}`)}</Table.Cell>
              <Table.Cell>{row.registration.localities?.name ?? ""}</Table.Cell>
              <Table.Cell>{displayLanguages(row.registration)}</Table.Cell>
              <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                {formatEuro(openCents(row.registration, row.fees), locale)}
              </Table.Cell>
              <Table.Cell>
                <PaymentTag row={row} payment="fee" />
              </Table.Cell>
              <Table.Cell>
                <PaymentTag row={row} payment="outline" />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
