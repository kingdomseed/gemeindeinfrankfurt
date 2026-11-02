import { Box, Button, Heading, HStack, Input, Table } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { ColumnHeader } from "@/components/ui/column-header";
import type { OutlineStock } from "@/lib/domain/payments";

// Outlines needed per language, with a form per row to record how many were ordered.
export function OutlineOrders(props: {
  trainingId: string;
  stock: readonly OutlineStock[];
  saveOrder: (form: FormData) => Promise<void>;
}) {
  const t = useTranslations("coordinator");
  const tl = useTranslations("common.languages");
  return (
    <Box as="section" aria-labelledby="outlines-heading">
      <Heading as="h2" id="outlines-heading" size="xl">
        {t("outlineCounts")}
      </Heading>
      <Table.ScrollArea mt="3">
        <Table.Root size="sm" maxW="md" fontVariantNumeric="tabular-nums" variant="line">
          <Table.Header>
            <Table.Row bg="transparent">
              <ColumnHeader>{t("language")}</ColumnHeader>
              <ColumnHeader align="end">{t("needed")}</ColumnHeader>
              <ColumnHeader>{t("ordered")}</ColumnHeader>
              <ColumnHeader align="end">{t("extra")}</ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {props.stock.map((s) => {
              const label = t("orderedFor", { language: tl(s.language) });
              const short = s.extra < 0;
              return (
                <Table.Row key={s.language} bg="transparent">
                  <Table.Cell as="th" scope="row" fontWeight="normal">
                    {tl(s.language)}
                  </Table.Cell>
                  <Table.Cell textAlign="end">{s.needed}</Table.Cell>
                  <Table.Cell>
                    <form action={props.saveOrder}>
                      <HStack gap="2">
                        <input type="hidden" name="training_id" value={props.trainingId} />
                        <input type="hidden" name="language" value={s.language} />
                        <Input
                          name="quantity"
                          type="number"
                          min={0}
                          defaultValue={s.ordered}
                          aria-label={label}
                          size="sm"
                          w="16"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          color="fg"
                          aria-label={`${t("save")}: ${label}`}
                        >
                          {t("save")}
                        </Button>
                      </HStack>
                    </form>
                  </Table.Cell>
                  <Table.Cell
                    textAlign="end"
                    color={short ? "fg.error" : undefined}
                    fontWeight={short ? "semibold" : undefined}
                  >
                    {short ? t("shortBy", { count: -s.extra }) : s.extra}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
}
