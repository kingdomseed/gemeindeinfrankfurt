"use client";

import { Button, chakra, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { focusOnMount } from "@/components/ui/focus";
import { Notice } from "@/components/ui/notice";

import type { CancelState } from "./types";

// "Cancel registration" on the registrant's edit page and the coordinator's
// registration page; `audience` picks the wording. The first press asks in
// place what cancelling means; only the second, explicit answer sends the form.
export function CancelRegistration(props: {
  action: (prev: CancelState) => Promise<CancelState>;
  audience: "registrant" | "coordinator";
}) {
  const [state, formAction, pending] = useActionState<CancelState>(props.action, {
    status: "idle",
  });
  // After "Keep my registration", focus goes back to the button that asked.
  const [step, setStep] = useState<"idle" | "confirming" | "kept">("idle");
  const { labels, messages } = useCancelText(props.audience);
  const message = messages[state.status];
  if (message) {
    return (
      <Notice tone="neutral" announce="status" focus>
        {message}
      </Notice>
    );
  }
  return (
    <Stack
      as="section"
      aria-labelledby="cancel-heading"
      borderTopWidth="1px"
      pt="6"
      gap="3"
      align="flex-start"
    >
      <Heading as="h2" id="cancel-heading" size="xl">
        {labels.cancel}
      </Heading>
      <Text>{labels.intro}</Text>
      {step === "confirming" ? (
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
            <Button variant="outline" px="6" disabled={pending} onClick={() => setStep("kept")}>
              {labels.keep}
            </Button>
          </Flex>
        </chakra.form>
      ) : (
        <Button
          ref={step === "kept" ? focusOnMount : undefined}
          variant="outline"
          color="fg.error"
          px="6"
          onClick={() => setStep("confirming")}
        >
          {labels.cancel}
        </Button>
      )}
    </Stack>
  );
}

type CancelText = {
  labels: Record<"cancel" | "intro" | "confirm" | "explain" | "yes" | "keep", string>;
  // Text for each status the action can answer with.
  messages: Partial<Record<CancelState["status"], string>>;
};

function useCancelText(audience: "registrant" | "coordinator"): CancelText {
  const te = useTranslations("edit");
  const tc = useTranslations("coordinator");
  const tr = useTranslations("register");
  if (audience === "coordinator") {
    return {
      labels: {
        cancel: tc("cancelTitle"),
        intro: tc("cancelIntro"),
        confirm: tc("cancelConfirm"),
        explain: tc("cancelExplain"),
        yes: tc("cancelYes"),
        keep: tc("cancelKeep"),
      },
      messages: { cancelled: tc("cancelledNotice"), error: tc("error") },
    };
  }
  return {
    labels: {
      cancel: te("cancel"),
      intro: te("cancelIntro"),
      confirm: te("cancelConfirm"),
      explain: te("cancelExplain"),
      yes: te("cancelYes"),
      keep: te("cancelKeep"),
    },
    messages: {
      cancelled: te("cancelled"),
      locked: te("locked"),
      error: tr("error"),
    },
  };
}
