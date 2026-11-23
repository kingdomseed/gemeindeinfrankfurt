"use client";

import { Button, chakra, Grid, Input, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { FormField } from "@/components/ui/form-field";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

type Details = { notes: string; firstDay: string; lastDay: string };
const fields = ["notes", "firstDay", "lastDay"] as const;
const pick = (value: (field: keyof Details) => string): Details => ({
  notes: value("notes"),
  firstDay: value("firstDay"),
  lastDay: value("lastDay"),
});

// The notes for Lebensstrom, and the actual first and last day when they
// differ from the schedule.
export function ReportDetailsForm(props: {
  initialNotes: string;
  initialFirstDay: string | null;
  initialLastDay: string | null;
  save: FormAction;
}) {
  const t = useTranslations("coordinator.report");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.save, {
    status: "idle",
  });
  const saved: Details = {
    notes: props.initialNotes,
    firstDay: props.initialFirstDay ?? "",
    lastDay: props.initialLastDay ?? "",
  };
  const [draft, setDraft] = useState(saved);
  const [base, setBase] = useState(saved);
  // Another coordinator saved: take their values for every field that is not
  // being edited here, so a later save does not put back old text.
  if (fields.some((f) => base[f] !== saved[f])) {
    setDraft(pick((f) => (draft[f] === base[f] ? saved[f] : draft[f])));
    setBase(saved);
  }
  const edit = (field: keyof Details, value: string) => setDraft((d) => ({ ...d, [field]: value }));
  return (
    <chakra.form action={formAction} display="flex" flexDirection="column" gap="4">
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="4">
        <FormField label={t("actualFirstDay")} help={t("actualDayHelp")}>
          <Input
            type="date"
            name="first_day"
            value={draft.firstDay}
            onChange={(e) => edit("firstDay", e.currentTarget.value)}
          />
        </FormField>
        <FormField label={t("actualLastDay")} help={t("actualDayHelp")}>
          <Input
            type="date"
            name="last_day"
            value={draft.lastDay}
            onChange={(e) => edit("lastDay", e.currentTarget.value)}
          />
        </FormField>
      </Grid>
      <FormField label={t("notes")} optionalLabel={t("optional")}>
        <Textarea
          name="notes"
          rows={4}
          maxLength={4000}
          value={draft.notes}
          onChange={(e) => edit("notes", e.currentTarget.value)}
        />
      </FormField>
      <Button type="submit" variant="outline" color="fg" alignSelf="flex-start" loading={pending}>
        {t("saveDetails")}
      </Button>
      <FormResult state={state} saved={t("saved")} />
    </chakra.form>
  );
}
