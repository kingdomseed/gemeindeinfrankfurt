"use client";

import { Button, chakra, Heading, HStack, Input, Stack, Table } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { ColumnHeader } from "@/components/ui/column-header";
import { Notice } from "@/components/ui/notice";
import { outlineOrdersFingerprint } from "@/lib/domain/list-sync";
import type { OutlineStock } from "@/lib/domain/payments";
import type { Language } from "@/lib/domain/types";

import { ConflictBanner } from "./ConflictBanner";
import { OutlineExtraTag } from "./OutlineExtraTag";
import type { FormAction } from "./types";
import { useCollaborativeForm } from "./useCollaborativeForm";

type OrderDraft = Record<Language, string>;

function toOrderDraft(stock: readonly OutlineStock[]): { draft: OrderDraft; version: string } {
  const counts: Record<Language, number> = { de: 0, en: 0, ru: 0 };
  for (const s of stock) counts[s.language] = s.ordered;
  return {
    draft: { de: String(counts.de), en: String(counts.en), ru: String(counts.ru) },
    version: outlineOrdersFingerprint(counts),
  };
}

// Outlines needed per language, split into first and second outlines, with
// one form to record how many were ordered.
export function OutlineOrders(props: {
  trainingId: string;
  stock: readonly OutlineStock[];
  saveOrder: FormAction;
}) {
  const t = useTranslations("coordinator");
  const tl = useTranslations("common.languages");
  const initial = toOrderDraft(props.stock);
  const collab = useCollaborativeForm({
    server: initial.draft,
    version: initial.version,
    action: props.saveOrder,
  });

  const liveOrdered = (lang: Language, fallback: number) => {
    const parsed = Number.parseInt(collab.draft[lang], 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };
  const sum = (pick: (s: OutlineStock) => number) => props.stock.reduce((n, s) => n + pick(s), 0);
  const totalOrdered = sum((s) => liveOrdered(s.language, s.ordered));
  const totalNeeded = sum((s) => s.needed);
  const totalExtra = totalOrdered - totalNeeded;

  const fieldLabels = {
    de: tl("de"),
    en: tl("en"),
    ru: tl("ru"),
  };

  return (
    <Stack as="section" aria-labelledby="order-heading" gap="3">
      <Heading as="h2" id="order-heading" size="xl">
        {t("neededAndOrdered")}
      </Heading>
      <chakra.form onSubmit={collab.submit} display="flex" flexDirection="column" gap="4">
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
              {props.stock.map((s) => {
                const ordered = liveOrdered(s.language, s.ordered);
                const extra = ordered - s.needed;
                return (
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
                        value={collab.draft[s.language]}
                        onChange={(e) => collab.edit(s.language, e.currentTarget.value)}
                        aria-label={t("orderedFor", { language: tl(s.language) })}
                        aria-invalid={extra < 0 || undefined}
                        w="20"
                        textAlign="end"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <OutlineExtraTag extra={extra} />
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
            <Table.Footer>
              <Table.Row bg="transparent" fontWeight="semibold">
                <Table.Cell as="th" scope="row">
                  {t("total")}
                </Table.Cell>
                <Table.Cell textAlign="end">{sum((s) => s.first)}</Table.Cell>
                <Table.Cell textAlign="end">{sum((s) => s.second)}</Table.Cell>
                <Table.Cell textAlign="end">{totalNeeded}</Table.Cell>
                <Table.Cell textAlign="end">{totalOrdered}</Table.Cell>
                <Table.Cell>
                  {totalExtra < 0 ? t("shortBy", { count: -totalExtra }) : `+${totalExtra}`}
                </Table.Cell>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
        </Table.ScrollArea>
        <ConflictBanner
          status={collab.state.status}
          conflicts={collab.state.conflicts}
          fieldLabels={fieldLabels}
          serverValues={collab.state.server}
          onUseServerField={collab.takeServerField}
          onAcceptAllServer={collab.acceptAllServer}
          onKeepLocal={collab.keepLocal}
        />
        <HStack gap="3" wrap="wrap">
          <Button type="submit" loading={collab.pending}>
            {t("saveOrder")}
          </Button>
        </HStack>
        {collab.state.status === "saved" && (
          <Notice tone="success" announce="status">
            {t("orderSaved")}
          </Notice>
        )}
        {collab.state.status === "error" && (
          <Notice tone="error" announce="alert">
            {collab.state.errorMessage ?? t("error")}
          </Notice>
        )}
      </chakra.form>
    </Stack>
  );
}
