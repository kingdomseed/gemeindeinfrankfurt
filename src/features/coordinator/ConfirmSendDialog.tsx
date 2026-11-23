"use client";

import { Button, Dialog, Portal } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

// Asks before an email goes out to many people, since it cannot be called
// back. The confirm button submits the form named by `form`.
export function ConfirmSendDialog(props: {
  trigger: ReactNode;
  title: string;
  body: string;
  form: string;
  confirm: string;
  disabled: boolean;
}) {
  const t = useTranslations("coordinator.emails");
  return (
    <Dialog.Root role="alertdialog">
      <Dialog.Trigger asChild disabled={props.disabled}>
        {props.trigger}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{props.title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{props.body}</Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" color="fg">
                  {t("notYet")}
                </Button>
              </Dialog.ActionTrigger>
              <Dialog.ActionTrigger asChild>
                <Button type="submit" form={props.form}>
                  {props.confirm}
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
