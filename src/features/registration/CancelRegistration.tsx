"use client";

import { Button, chakra } from "@chakra-ui/react";
import { useActionState } from "react";

import { Notice } from "@/components/ui/notice";

import type { ActionState } from "./types";

// The "cancel my registration" button on the edit page, with a confirm step.
export function CancelRegistration(props: {
  action: (prev: ActionState) => Promise<ActionState>;
  label: string;
  confirm: string;
  messages: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(props.action, { status: "idle" });
  const message = props.messages[state.status];
  if (message) {
    return (
      <Notice tone="neutral" announce="status">
        {message}
      </Notice>
    );
  }
  return (
    <chakra.form
      borderTopWidth="1px"
      pt="6"
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(props.confirm)) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        variant="plain"
        px="0"
        color="fg.error"
        fontWeight="semibold"
        textDecoration="underline"
        disabled={pending}
      >
        {props.label}
      </Button>
    </chakra.form>
  );
}
