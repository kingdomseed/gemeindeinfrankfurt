"use client";

import { Button, chakra, Grid, HStack, Input, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useRef, useState } from "react";

import type { Hymn } from "@/lib/domain/messages";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

type Row = Hymn & { key: number };

// Hymn numbers for one message, quick to type when they arrive late. A box
// left empty means the hymn does not exist in that language.
export function HymnsForm(props: {
  // What is saved now; the form keeps its own copy while it is open.
  initialHymns: readonly Hymn[];
  action: FormAction;
}) {
  const t = useTranslations("coordinator.messages");
  const tl = useTranslations("common.languages");
  const [rows, setRows] = useState<Row[]>(() =>
    props.initialHymns.map((h, key) => ({ ...h, key })),
  );
  const nextKey = useRef(props.initialHymns.length);
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  const add = () => {
    setRows([...rows, { key: nextKey.current, en: "", de: "", ru: "" }]);
    nextKey.current += 1;
  };
  // Inputs follow `rows`, so what was typed stays after the form is sent.
  const change = (key: number, field: "en" | "de" | "ru", value: string) =>
    setRows((all) => all.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  const columns = { base: "2rem repeat(3, minmax(0, 1fr)) auto" };
  return (
    <chakra.form action={formAction} display="flex" flexDirection="column" gap="3">
      <Grid templateColumns={columns} gap="2" alignItems="center" fontSize="sm" color="fg.muted">
        <Text>{t("order")}</Text>
        <Text>{tl("en")}</Text>
        <Text>{tl("de")}</Text>
        <Text>{tl("ru")}</Text>
        <span />
      </Grid>
      {rows.map((row, i) => (
        <Grid key={row.key} templateColumns={columns} gap="2" alignItems="center">
          <Text fontVariantNumeric="tabular-nums">{i + 1}</Text>
          <Input
            name="en"
            value={row.en}
            onChange={(e) => change(row.key, "en", e.currentTarget.value)}
            inputMode="numeric"
            required
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("en") })}
          />
          <Input
            name="de"
            value={row.de ?? ""}
            onChange={(e) => change(row.key, "de", e.currentTarget.value)}
            inputMode="numeric"
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("de") })}
          />
          <Input
            name="ru"
            value={row.ru ?? ""}
            onChange={(e) => change(row.key, "ru", e.currentTarget.value)}
            inputMode="numeric"
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("ru") })}
          />
          <Button
            variant="ghost"
            size="sm"
            color="fg"
            onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
            aria-label={t("removeHymn", { number: i + 1 })}
          >
            {t("remove")}
          </Button>
        </Grid>
      ))}
      <HStack gap="3" wrap="wrap">
        <Button variant="outline" color="fg" onClick={add}>
          {t("addHymn")}
        </Button>
        <Button type="submit" loading={pending}>
          {t("saveHymns")}
        </Button>
      </HStack>
      <FormResult state={state} saved={t("saved")} />
    </chakra.form>
  );
}
