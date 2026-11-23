"use client";

import { Button, chakra, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { ConfirmSendDialog } from "./ConfirmSendDialog";
import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

// Sends the payment reminder to everyone who still owes money, after asking.
export function PaymentReminderButton(props: { count: number; send: FormAction }) {
  const t = useTranslations("coordinator.emails");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.send, {
    status: "idle",
  });
  return (
    <Stack gap="2" align="flex-end">
      <chakra.form id="payment-reminder" action={formAction} />
      <ConfirmSendDialog
        form="payment-reminder"
        disabled={props.count === 0}
        title={t("reminderConfirmTitle", { count: props.count })}
        body={t("reminderConfirmBody")}
        confirm={t("sendTo", { count: props.count })}
        trigger={
          <Button variant="outline" color="fg" size="sm" loading={pending}>
            {t("sendTo", { count: props.count })}
          </Button>
        }
      />
      <FormResult state={state} saved={state.message ?? ""} />
    </Stack>
  );
}
