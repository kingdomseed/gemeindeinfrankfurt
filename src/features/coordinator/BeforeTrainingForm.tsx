"use client";

import { Button, chakra, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/ui/form-field";
import { languages } from "@/lib/domain/types";

import { ConfirmSendDialog } from "./ConfirmSendDialog";
import { FormResult } from "./FormResult";
import type { FormState } from "./types";

// The "Before the training" email: the schedule, place and rules come from
// the training; coordinators add how to join the WhatsApp group and what to
// bring, in each language they have.
export function BeforeTrainingForm(props: {
  count: number;
  send: (prev: FormState, form: FormData) => Promise<FormState>;
}) {
  const t = useTranslations("coordinator.emails");
  const tl = useTranslations("common.languages");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.send, {
    status: "idle",
  });
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
          <Textarea name={`note_${l}`} rows={3} maxLength={10_000} lang={l} />
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
