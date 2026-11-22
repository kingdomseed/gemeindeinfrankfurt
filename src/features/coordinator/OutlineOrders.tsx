"use client";

import { Button, chakra, Heading, HStack, Input, Stack, Table } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { ColumnHeader } from "@/components/ui/column-header";
import { Notice } from "@/components/ui/notice";
import type { OutlineStock } from "@/lib/domain/payments";

import { OutlineExtraTag } from "./OutlineExtraTag";
import type { FormState } from "./types";

// Outlines needed per language, split into first and second outlines, with
// one form to record how many were ordered.
export function OutlineOrders(props: {
  trainingId: string;
  stock: readonly OutlineStock[];
  saveOrder: (prev: FormState, form: FormData) => Promise<FormState>;
}) {
  const t = useTranslations("coordinator");
  const tl = useTranslations("common.languages");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.saveOrder, {
    status: "idle",
  });
  const sum = (pick: (s: OutlineStock) => number) => props.stock.reduce((n, s) => n + pick(s), 0);
  const totalExtra = sum((s) => s.extra);
  return (
    <Stack as="section" aria-labelledby="order-heading" gap="3">
      <Heading as="h2" id="order-heading" size="xl">
        {t("neededAndOrdered")}
      </Heading>
      <chakra.form action={formAction} display="flex" flexDirection="column" gap="4">
        <input type="hidden" name="training_id" value={props.trainingId} />
        <Table.ScrollArea>
          <Table.Root size="sm" variant="line" fontVariantNumeric="tabular-nums">
            <Table.Header>
              <Table.Row bg="transparent">
                <ColumnHeader>{t("language")}</ColumnHeader>
                <ColumnHeader align="end">{t("firstOutline")}</ColumnHeader>
                <ColumnHeader align="end">{t("secondOutline")}</ColumnHeader>
                <ColumnHeader align="end">{t("needed")}</ColumnHeader>
                <ColumnHeader align="end">{t("ordered")}</ColumnHeader>
                <ColumnHeader>{t("extra")}</ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {props.stock.map((s) => (
                <Table.Row key={s.language} bg="transparent">
                  <Table.Cell as="th" scope="row" fontWeight="normal">
                    {tl(s.language)}
                  </Table.Cell>
                  <Table.Cell textAlign="end">{s.first}</Table.Cell>
                  <Table.Cell textAlign="end">{s.second}</Table.Cell>
                  <Table.Cell textAlign="end">{s.needed}</Table.Cell>
                  <Table.Cell textAlign="end">
                    <Input
                      name={s.language}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      defaultValue={s.ordered}
                      aria-label={t("orderedFor", { language: tl(s.language) })}
                      aria-invalid={s.extra < 0 || undefined}
                      w="20"
                      textAlign="end"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <OutlineExtraTag extra={s.extra} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
            <Table.Footer>
              <Table.Row bg="transparent" fontWeight="semibold">
                <Table.Cell as="th" scope="row">
                  {t("total")}
                </Table.Cell>
                <Table.Cell textAlign="end">{sum((s) => s.first)}</Table.Cell>
                <Table.Cell textAlign="end">{sum((s) => s.second)}</Table.Cell>
                <Table.Cell textAlign="end">{sum((s) => s.needed)}</Table.Cell>
                <Table.Cell textAlign="end">{sum((s) => s.ordered)}</Table.Cell>
                <Table.Cell>
                  {totalExtra < 0 ? t("shortBy", { count: -totalExtra }) : `+${totalExtra}`}
                </Table.Cell>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
        </Table.ScrollArea>
        <HStack gap="3" wrap="wrap">
          <Button type="submit" loading={pending}>
            {t("saveOrder")}
          </Button>
        </HStack>
        {state.status === "saved" && (
          <Notice tone="success" announce="status">
            {t("orderSaved")}
          </Notice>
        )}
        {state.status === "error" && (
          <Notice tone="error" announce="alert">
            {t("error")}
          </Notice>
        )}
      </chakra.form>
    </Stack>
  );
}
