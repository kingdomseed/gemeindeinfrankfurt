"use client";

import { Button, chakra, Fieldset, HStack, Input, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useRef, useState } from "react";

import { FormField } from "@/components/ui/form-field";
import type { Verse } from "@/lib/domain/messages";
import { languages } from "@/lib/domain/types";

import { FormResult } from "./FormResult";
import type { FormState } from "./types";

type Row = Verse & { key: number };

// The verses of one message in reading order, one slide each, with the text
// in every language the screens show.
export function VersesForm(props: {
  // What is saved now; the form keeps its own copy while it is open.
  initialVerses: readonly Verse[];
  action: (prev: FormState, form: FormData) => Promise<FormState>;
}) {
  const t = useTranslations("coordinator.messages");
  const tl = useTranslations("common.languages");
  const [rows, setRows] = useState<Row[]>(() =>
    props.initialVerses.map((v, key) => ({ ...v, key })),
  );
  const nextKey = useRef(props.initialVerses.length);
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  const add = () => {
    setRows([...rows, { key: nextKey.current, ref: "", text: {} }]);
    nextKey.current += 1;
  };
  // Inputs follow `rows`, so what was typed stays after the form is sent.
  const change = (key: number, update: (row: Row) => Row) =>
    setRows((all) => all.map((r) => (r.key === key ? update(r) : r)));
  return (
    <chakra.form action={formAction} display="flex" flexDirection="column" gap="4">
      {rows.map((row, i) => (
        <Fieldset.Root key={row.key} borderWidth="1px" rounded="lg" p="4" gap="3">
          <Fieldset.Legend fontWeight="medium">
            {t("verseNumber", { number: i + 1 })}
          </Fieldset.Legend>
          <FormField label={t("reference")}>
            <Input
              name="ref"
              value={row.ref}
              onChange={(e) => {
                const ref = e.currentTarget.value;
                change(row.key, (r) => ({ ...r, ref }));
              }}
              required
              maxLength={100}
            />
          </FormField>
          {languages.map((l) => (
            <FormField key={l} label={tl(l)}>
              <Textarea
                name={`text_${l}`}
                value={row.text[l] ?? ""}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  change(row.key, (r) => ({ ...r, text: { ...r.text, [l]: value } }));
                }}
                rows={3}
                maxLength={4000}
                lang={l}
              />
            </FormField>
          ))}
          <Button
            variant="ghost"
            size="sm"
            color="fg"
            alignSelf="flex-start"
            onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
          >
            {t("removeVerse", { number: i + 1 })}
          </Button>
        </Fieldset.Root>
      ))}
      <HStack gap="3" wrap="wrap">
        <Button variant="outline" color="fg" onClick={add}>
          {t("addVerse")}
        </Button>
        <Button type="submit" loading={pending}>
          {t("saveVerses")}
        </Button>
      </HStack>
      <FormResult state={state} saved={t("saved")} />
    </chakra.form>
  );
}
