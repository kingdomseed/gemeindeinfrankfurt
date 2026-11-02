import { Box, Heading, Table, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { ColumnHeader } from "@/components/ui/column-header";
import { berlinDayTime } from "@/lib/domain/sessions";

// What a registrant can still change with their edit link, and until when.
export function ChangeCutoffs({ seatLockAt }: { seatLockAt: Date }) {
  const t = useTranslations("home");
  const locale = useLocale();
  return (
    <Box as="section" aria-labelledby="changes-heading">
      <Heading as="h2" id="changes-heading" size="xl">
        {t("changesTitle")}
      </Heading>
      <Text mt="1">{t("changesIntro")}</Text>
      <Table.ScrollArea mt="3">
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="transparent">
              <ColumnHeader>{t("changeWhat")}</ColumnHeader>
              <ColumnHeader>{t("changeUntil")}</ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row bg="transparent">
              <Table.Cell as="th" scope="row" fontWeight="normal">
                {t("changeSeat")}
              </Table.Cell>
              <Table.Cell fontVariantNumeric="tabular-nums">
                {berlinDayTime(seatLockAt, locale)}
              </Table.Cell>
            </Table.Row>
            <Table.Row bg="transparent">
              <Table.Cell as="th" scope="row" fontWeight="normal">
                {t("changeDetails")}
              </Table.Cell>
              <Table.Cell>{t("anyTime")}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
}
