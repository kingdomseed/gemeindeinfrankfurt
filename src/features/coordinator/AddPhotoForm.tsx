"use client";

import { Button, chakra } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { FormResult } from "./FormResult";
import { ReceiptInput } from "./ReceiptInput";
import type { FormAction, FormState } from "./types";

// Adds the missing invoice photo to a cost.
export function AddPhotoForm(props: { label: string; add: FormAction }) {
  const t = useTranslations("coordinator.report");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.add, {
    status: "idle",
  });
  const [shrinking, setShrinking] = useState(false);
  return (
    <chakra.form action={formAction} display="flex" gap="2" alignItems="center" flexWrap="wrap">
      <ReceiptInput label={props.label} busy={setShrinking} />
      <Button
        type="submit"
        size="xs"
        variant="outline"
        color="fg"
        loading={pending}
        disabled={shrinking}
      >
        {t("savePhoto")}
      </Button>
      <FormResult state={state} saved={t("photoSaved")} />
    </chakra.form>
  );
}
