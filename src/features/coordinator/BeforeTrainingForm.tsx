"use client";

import { Button, chakra, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { FormField } from "@/components/ui/form-field";
import { languages, type Language } from "@/lib/domain/types";

import { ConfirmSendDialog } from "./ConfirmSendDialog";
import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

// The "Before the training" email: the schedule, place and rules come from
// the training; coordinators add how to join the WhatsApp group and what to
// bring, in each language they have.
export function BeforeTrainingForm(props: { count: number; send: FormAction }) {
  const t = useTranslations("coordinator.emails");
  const tl = useTranslations("common.languages");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.send, {
    status: "idle",
  });
  // The notes are held here, so an error does not clear them.
  const [notes, setNotes] = useState<Record<Language, string>>({ de: "", en: "", ru: "" });
  return (
    <chakra.form
      id="before-training"
      action={formAction}
      display="flex"
      flexDirection="column"
      gap="4"
    >
      {languages.map((l) => (
        <FormField key={l} label={t("noteIn", { language: tl(l) })}>
          <Textarea
            name={`note_${l}`}
            rows={3}
            maxLength={10_000}
            lang={l}
            value={notes[l]}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setNotes((n) => ({ ...n, [l]: value }));
            }}
          />
        </FormField>
      ))}
      <ConfirmSendDialog
        form="before-training"
        disabled={props.count === 0}
        title={t("beforeConfirmTitle", { count: props.count })}
        body={t("beforeConfirmBody")}
        confirm={t("sendTo", { count: props.count })}
        trigger={
          <Button alignSelf="flex-start" loading={pending}>
            {t("sendTo", { count: props.count })}
          </Button>
        }
      />
      <FormResult state={state} saved={state.message ?? ""} />
    </chakra.form>
  );
}
