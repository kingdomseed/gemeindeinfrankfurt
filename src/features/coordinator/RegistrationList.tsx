import { Box, Heading, HStack, List, Table, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { formatEuro } from "@/lib/domain/fees";

import { PaymentToggle } from "./PaymentToggle";
import type { RegistrationRow, SetPaymentFlag } from "./types";

function displayName({ registration: r }: RegistrationRow) {
  const partner =
    r.seat_type === "shared" ? ` + ${r.partner_first_name} ${r.partner_last_name}` : "";
  return `${r.first_name} ${r.last_name}${partner}`;
}

function displayLanguages({ registration: r }: RegistrationRow) {
  const second = r.second_outline_language ? ` + ${r.second_outline_language.toUpperCase()}` : "";
  return `${r.group_language.toUpperCase()} / ${r.outline_language.toUpperCase()}${second}`;
}

function Toggles(props: {
  row: RegistrationRow;
  setPaymentFlag: SetPaymentFlag;
  only?: "fee" | "outline";
  showLabels?: boolean;
}) {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  const { registration: r, fees } = props.row;
  const name = displayName(props.row);
  const visible = (label: string, cents: number) =>
    props.showLabels ? `${label} · ${formatEuro(cents, locale)}` : undefined;
  const fee = fees.waived ? (
    <Text
      as="span"
      display="inline-flex"
      minH="11"
      alignItems="center"
      fontSize="sm"
      color="fg.muted"
    >
      {t("waived")}
    </Text>
  ) : (
    <PaymentToggle
      id={r.id}
      field="fee_paid"
      value={r.fee_paid}
      setPaymentFlag={props.setPaymentFlag}
      label={`${t("feePaid")}: ${name}`}
      visibleLabel={visible(t("feePaid"), fees.trainingCents)}
      failedLabel={t("saveFailed")}
    />
  );
  const outline = (
    <PaymentToggle
      id={r.id}
      field="outline_paid"
      value={r.outline_paid}
      setPaymentFlag={props.setPaymentFlag}
      label={`${t("outlinePaid")}: ${name}`}
      visibleLabel={visible(t("outlinePaid"), fees.outlineCents)}
      failedLabel={t("saveFailed")}
    />
  );
  if (props.only === "fee") return fee;
  if (props.only === "outline") return outline;
  return (
    <HStack wrap="wrap" columnGap="6" mt="1">
      {fee}
      {outline}
    </HStack>
  );
}

// Phones: one card per registration, with labelled payment toggles.
function RegistrationCards(props: {
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
          <Toggles row={row} setPaymentFlag={props.setPaymentFlag} showLabels />
        </List.Item>
      ))}
    </List.Root>
  );
}

function ColumnHeader({ children }: { children: string }) {
  return (
    <Table.ColumnHeader color="fg.muted" fontWeight="normal">
      {children}
    </Table.ColumnHeader>
  );
}

// Wider screens: one table row per registration.
function RegistrationTable(props: {
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
                <Toggles row={row} setPaymentFlag={props.setPaymentFlag} only="fee" />
              </Table.Cell>
              <Table.Cell py="0">
                <Toggles row={row} setPaymentFlag={props.setPaymentFlag} only="outline" />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export function RegistrationList(props: {
  rows: readonly RegistrationRow[];
  setPaymentFlag: SetPaymentFlag;
}) {
  const t = useTranslations("coordinator");
  return (
    <Box as="section" aria-labelledby="registrations-heading">
      <Heading as="h2" id="registrations-heading" size="xl" fontWeight="semibold">
        {t("registrations")}
      </Heading>
      <RegistrationCards {...props} />
      <RegistrationTable {...props} />
    </Box>
  );
}
