"use client";

import { Button, chakra, Flex, Stack, Text } from "@chakra-ui/react";
import { useActionState, useState } from "react";

import { focusOnMount } from "@/components/ui/focus";
import { Notice } from "@/components/ui/notice";

import type { ActionState } from "./types";

// "Cancel registration" on the edit page. The first press asks in place what
// cancelling means; only the second, explicit answer sends the form.
export function CancelRegistration(props: {
  action: (prev: ActionState) => Promise<ActionState>;
  labels: { cancel: string; confirm: string; explain: string; yes: string; keep: string };
  messages: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(props.action, { status: "idle" });
  const [asking, setAsking] = useState(false);
  // After "Keep my registration", focus goes back to the button that asked.
  const [answered, setAnswered] = useState(false);
  const { labels } = props;
  const message = props.messages[state.status];
  if (message) {
    return (
      <Notice tone="neutral" announce="status" focus>
        {message}
      </Notice>
    );
  }
  return (
    <Stack as="section" borderTopWidth="1px" pt="6" align="flex-start">
      {asking ? (
        <chakra.form action={formAction} display="flex" flexDirection="column" gap="3">
          <Text ref={focusOnMount} tabIndex={-1} outline="none" fontWeight="semibold">
            {labels.confirm}
          </Text>
          <Text color="fg.muted">{labels.explain}</Text>
          <Flex wrap="wrap" gap="3">
            <Button
              type="submit"
              colorPalette="danger"
              px="6"
              disabled={pending}
              cursor={pending ? "wait" : undefined}
            >
              {labels.yes}
            </Button>
            <Button
              variant="outline"
              px="6"
              disabled={pending}
              onClick={() => {
                setAsking(false);
                setAnswered(true);
              }}
            >
              {labels.keep}
            </Button>
          </Flex>
        </chakra.form>
      ) : (
        <Button
          ref={answered ? focusOnMount : undefined}
          variant="outline"
          color="fg.error"
          px="6"
          onClick={() => setAsking(true)}
        >
          {labels.cancel}
        </Button>
      )}
    </Stack>
  );
}
