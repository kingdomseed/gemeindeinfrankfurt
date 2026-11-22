import { Box, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import { StatusTag } from "@/components/ui/status-tag";

import { BeforeTrainingForm } from "./BeforeTrainingForm";
import { EmailKindRow } from "./EmailKindRow";
import { MessageForm, type AudienceOption } from "./MessageForm";
import { PaymentReminderButton } from "./PaymentReminderButton";
import type { FormState } from "./types";
import { WorkspaceSection } from "./WorkspaceSection";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

export type SentRow = { id: string; when: string; line: string; count: number };

// The Emails page: the kinds of email with their state, the "Before the
// training" email, a message to everyone or a group, and what was sent.
export function EmailsWorkspace(props: {
  unpaid: number;
  registered: number;
  before: { tone: "success" | "warning" | "neutral"; label: string } | null;
  audiences: readonly AudienceOption[];
  sent: readonly SentRow[];
  actions: { reminder: Action; before: Action; message: Action };
}) {
  const t = useTranslations("coordinator.emails");
  return (
    <Stack gap="10" maxW="3xl">
      <PageHeading title={t("title")} subtitle={t("lead")} />

      <WorkspaceSection title={t("kindsTitle")}>
        <List.Root listStyle="none" borderTopWidth="1px">
          <EmailKindRow name={t("kinds.confirmation.name")} what={t("kinds.confirmation.what")}>
            <StatusTag>{t("automatic")}</StatusTag>
          </EmailKindRow>
          <EmailKindRow name={t("kinds.cancellation.name")} what={t("kinds.cancellation.what")}>
            <StatusTag>{t("automatic")}</StatusTag>
          </EmailKindRow>
          <EmailKindRow name={t("kinds.reminder.name")} what={t("kinds.reminder.what")}>
            <PaymentReminderButton count={props.unpaid} send={props.actions.reminder} />
          </EmailKindRow>
          <EmailKindRow name={t("kinds.before.name")} what={t("kinds.before.what")}>
            {props.before && <StatusTag tone={props.before.tone}>{props.before.label}</StatusTag>}
          </EmailKindRow>
        </List.Root>
      </WorkspaceSection>

      <WorkspaceSection title={t("kinds.before.name")} help={t("beforeHelp")}>
        <BeforeTrainingForm count={props.registered} send={props.actions.before} />
      </WorkspaceSection>

      <WorkspaceSection title={t("messageTitle")} help={t("messageHelp")}>
        <MessageForm audiences={props.audiences} send={props.actions.message} />
      </WorkspaceSection>

      <WorkspaceSection title={t("sentTitle")}>
        {props.sent.length === 0 ? (
          <Text color="fg.muted">{t("nothingSent")}</Text>
        ) : (
          <List.Root as="ol" listStyle="none" borderTopWidth="1px" fontSize="sm">
            {props.sent.map((s) => (
              <List.Item
                key={s.id}
                display="grid"
                gridTemplateColumns={{ base: "1fr auto", sm: "7rem minmax(0, 1fr) auto" }}
                columnGap="4"
                py="2"
                borderBottomWidth="1px"
                alignItems="center"
              >
                <Text color="fg.muted" fontVariantNumeric="tabular-nums">
                  {s.when}
                </Text>
                <Box
                  minW="0"
                  gridColumn={{ base: "1 / -1", sm: "auto" }}
                  gridRow={{ base: "2", sm: "auto" }}
                >
                  {s.line}
                </Box>
                <Text color="fg.muted" fontVariantNumeric="tabular-nums">
                  {t("people", { count: s.count })}
                </Text>
              </List.Item>
            ))}
          </List.Root>
        )}
      </WorkspaceSection>
    </Stack>
  );
}
