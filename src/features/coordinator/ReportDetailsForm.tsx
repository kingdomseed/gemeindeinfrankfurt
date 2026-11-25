"use client";

import { Button, chakra, Grid, Input, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import type { FormAction } from "./types";
import { useCollaborativeForm } from "./useCollaborativeForm";

type Details = { notes: string; first_day: string; last_day: string };

// The notes for Lebensstrom, and the actual first and last day when they
// differ from the schedule. Uses 3-way draft sync for non-overlapping edits
// and explicit resolution for same-field collisions.
export function ReportDetailsForm(props: {
  initialNotes: string;
  initialFirstDay: string | null;
  initialLastDay: string | null;
  updatedAt: string;
  save: FormAction;
}) {
  const t = useTranslations("coordinator.report");
  const server: Details = {
    notes: props.initialNotes,
    first_day: props.initialFirstDay ?? "",
    last_day: props.initialLastDay ?? "",
  };
  const collab = useCollaborativeForm({ server, version: props.updatedAt, action: props.save });
  const fieldLabels = {
    first_day: t("actualFirstDay"),
    last_day: t("actualLastDay"),
    notes: t("notes"),
  };

  return (
    <chakra.form onSubmit={collab.submit} display="flex" flexDirection="column" gap="4">
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="4">
        <FormField label={t("actualFirstDay")} help={t("actualDayHelp")}>
          <Input
            type="date"
            name="first_day"
            value={collab.draft.first_day}
            onChange={(e) => collab.edit("first_day", e.currentTarget.value)}
          />
        </FormField>
        <FormField label={t("actualLastDay")} help={t("actualDayHelp")}>
          <Input
            type="date"
            name="last_day"
            value={collab.draft.last_day}
            onChange={(e) => collab.edit("last_day", e.currentTarget.value)}
          />
        </FormField>
      </Grid>
      <FormField label={t("notes")} optionalLabel={t("optional")}>
        <Textarea
          name="notes"
          rows={4}
          maxLength={4000}
          value={collab.draft.notes}
          onChange={(e) => collab.edit("notes", e.currentTarget.value)}
        />
      </FormField>
      <ConflictBanner {...collab.bannerProps} fieldLabels={fieldLabels} />
      <Button
        type="submit"
        variant="outline"
        color="fg"
        alignSelf="flex-start"
        loading={collab.pending}
      >
        {t("saveDetails")}
      </Button>
      <FormResult state={collab.result} saved={t("saved")} />
    </chakra.form>
  );
}
