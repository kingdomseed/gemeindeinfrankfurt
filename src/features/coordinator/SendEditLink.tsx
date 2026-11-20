"use client";

import { Button, chakra, Heading, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Notice } from "@/components/ui/notice";

import type { FormState } from "./types";

// Emails the registrant a fresh edit link; the old one stops working.
export function SendEditLink(props: { action: (prev: FormState) => Promise<FormState> }) {
  const t = useTranslations("coordinator");
  const [state, formAction, pending] = useActionState<FormState>(props.action, { status: "idle" });
  return (
    <chakra.form
      action={formAction}
      aria-labelledby="link-heading"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap="3"
      borderTopWidth="1px"
      pt="6"
    >
      <Heading as="h2" id="link-heading" size="xl">
        {t("sendLinkTitle")}
      </Heading>
      <Text>{t("sendLinkHelp")}</Text>
      {!pending && state.status !== "idle" && (
        <Notice
          tone={state.status === "saved" ? "success" : "warning"}
          announce={state.status === "saved" ? "status" : "alert"}
          focus
        >
          {state.status === "saved" ? t("editLinkSent") : t("error")}
        </Notice>
      )}
      <Button type="submit" variant="outline" px="6" disabled={pending}>
        {t("sendEditLink")}
      </Button>
    </chakra.form>
  );
}
