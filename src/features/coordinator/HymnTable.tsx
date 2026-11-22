import { Table, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { hymnNumber, occurrenceKeys, type Hymn } from "@/lib/domain/messages";
import { languages } from "@/lib/domain/types";

// The hymns of a message with their number in each language.
export function HymnTable({ hymns }: { hymns: readonly Hymn[] }) {
  const t = useTranslations("coordinator.messages");
  const tl = useTranslations("common.languages");
  if (hymns.length === 0) return <Text color="fg.muted">{t("noHymns")}</Text>;
  const order = ["en", ...languages.filter((l) => l !== "en")] as const;
  const keys = occurrenceKeys(hymns.map((h) => h.en));
  return (
    <Table.ScrollArea>
      <Table.Root size="sm" minW="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t("order")}</Table.ColumnHeader>
            {order.map((l) => (
              <Table.ColumnHeader key={l} textAlign="end">
                {tl(l)}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {hymns.map((h, i) => (
            <Table.Row key={keys[i]}>
              <Table.Cell fontVariantNumeric="tabular-nums">{i + 1}</Table.Cell>
              {order.map((l) => {
                const n = hymnNumber(h, l);
                return (
                  <Table.Cell key={l} textAlign="end" fontVariantNumeric="tabular-nums">
                    {n ?? (
                      <Text as="span" fontSize="sm" color="fg.muted">
                        {t("notIn", { language: tl(l) })}
                      </Text>
                    )}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
