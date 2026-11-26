"use client";

import {
  Box,
  Button,
  chakra,
  Checkbox,
  HStack,
  List,
  NativeSelect,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition, type SyntheticEvent } from "react";

import { ColumnHeader } from "@/components/ui/column-header";
import { StatusTag } from "@/components/ui/status-tag";
import { coordinatorRoles } from "@/lib/domain/roles";
import type { TeamMember } from "@/lib/team";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

type ActionKind = "resend" | "remove" | "av" | "role";

// Everyone who can sign in, aligned in a table on wider screens and stacked cards
// on phones. Admins can change roles (Admin, Coordinator, Helper), AV service, and remove members.
export function TeamList(props: {
  members: readonly TeamMember[];
  canManage: boolean;
  actions: { resend: FormAction; remove: FormAction; av: FormAction; role: FormAction };
}) {
  const t = useTranslations("coordinator.team");
  const format = useFormatter();
  const [feedback, setFeedback] = useState<{ kind: ActionKind; state: FormState } | null>(null);
  const [pending, startTransition] = useTransition();

  const savedLabel: Record<ActionKind, string> = {
    resend: t("linkSent"),
    remove: t("removed"),
    av: t("avChanged"),
    role: t("roleChanged"),
  };

  function run(kind: ActionKind, e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const next = await props.actions[kind]({ status: "idle" }, form);
      setFeedback({ kind, state: next });
    });
  }

  function submitField(kind: "role" | "av", userId: string, field: string, nextValue: string) {
    const form = new FormData();
    form.set("user_id", userId);
    form.set(field, nextValue);
    startTransition(async () => {
      const next = await props.actions[kind]({ status: "idle" }, form);
      setFeedback({ kind, state: next });
    });
  }

  function signedInLabel(lastSignInAt: string | null) {
    if (!lastSignInAt) return <StatusTag tone="warning">{t("notSignedIn")}</StatusTag>;
    return (
      <Text as="span" fontSize="sm" color="fg.muted">
        {format.dateTime(new Date(lastSignInAt), { dateStyle: "medium" })}
      </Text>
    );
  }

  function roleControl(m: TeamMember, showLabel: boolean) {
    if (!props.canManage) {
      return (
        <StatusTag tone={m.role === "admin" ? "brand" : "neutral"}>
          {t(`roles.${m.role}`)}
        </StatusTag>
      );
    }
    const select = (
      <NativeSelect.Root size="sm" width="auto" disabled={pending || m.isYou}>
        <NativeSelect.Field
          aria-label={`${t("changeRole")}: ${m.name}`}
          value={m.role}
          onChange={(e) => submitField("role", m.userId, "role", e.currentTarget.value)}
        >
          {coordinatorRoles.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    );
    if (!showLabel) return select;
    return (
      <HStack gap="2">
        <Text fontSize="sm" color="fg.muted">
          {t("role")}
        </Text>
        {select}
      </HStack>
    );
  }

  function avControl(m: TeamMember, showLabel: boolean) {
    if (!props.canManage) {
      if (m.servesAv) return <StatusTag tone="neutral">{t("av")}</StatusTag>;
      return showLabel ? null : (
        <Text as="span" color="fg.muted">
          —
        </Text>
      );
    }
    const actionLabel = m.servesAv ? `${t("leaveAv")}: ${m.name}` : `${t("joinAv")}: ${m.name}`;
    return (
      <Checkbox.Root
        checked={m.servesAv}
        disabled={pending}
        onCheckedChange={(e) =>
          submitField("av", m.userId, "serves_av", String(e.checked === true))
        }
        cursor={pending ? "not-allowed" : "pointer"}
      >
        <Checkbox.HiddenInput aria-label={actionLabel} />
        <Checkbox.Control />
        <Checkbox.Label srOnly={!showLabel} fontWeight="normal">
          {showLabel ? t("av") : actionLabel}
        </Checkbox.Label>
      </Checkbox.Root>
    );
  }

  function rowActions(m: TeamMember) {
    return (
      <HStack gap="2" whiteSpace="nowrap">
        <form onSubmit={(e) => run("resend", e)}>
          <input type="hidden" name="user_id" value={m.userId} />
          <Button type="submit" size="xs" variant="ghost" color="fg" disabled={pending}>
            {t("sendLink")}
          </Button>
        </form>
        {props.canManage && !m.isYou && (
          <form onSubmit={(e) => run("remove", e)}>
            <input type="hidden" name="user_id" value={m.userId} />
            <Button
              type="submit"
              size="xs"
              variant="ghost"
              color="fg.error"
              disabled={pending}
              aria-label={`${t("remove")}: ${m.name}`}
            >
              {t("remove")}
            </Button>
          </form>
        )}
      </HStack>
    );
  }

  return (
    <Stack as="section" aria-labelledby="team-heading" gap="3">
      <Text as="h2" id="team-heading" fontSize="xl" fontWeight="semibold">
        {t("whoCanSignIn")}
      </Text>
      <Table.ScrollArea hideBelow="md">
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="transparent">
              <ColumnHeader>{t("name")}</ColumnHeader>
              <ColumnHeader>{t("signedIn")}</ColumnHeader>
              <ColumnHeader>{t("role")}</ColumnHeader>
              <ColumnHeader>{t("av")}</ColumnHeader>
              <ColumnHeader>
                <chakra.span srOnly>{t("actions")}</chakra.span>
              </ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {props.members.map((m) => (
              <Table.Row key={m.userId} bg="transparent">
                <Table.Cell as="th" scope="row" fontWeight="normal">
                  <Text fontWeight="medium">
                    {m.name}
                    {m.isYou && (
                      <Text as="span" color="fg.muted" fontWeight="normal">
                        {` · ${t("you")}`}
                      </Text>
                    )}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {m.email}
                  </Text>
                </Table.Cell>
                <Table.Cell whiteSpace="nowrap">{signedInLabel(m.lastSignInAt)}</Table.Cell>
                <Table.Cell>{roleControl(m, false)}</Table.Cell>
                <Table.Cell>{avControl(m, false)}</Table.Cell>
                <Table.Cell>{rowActions(m)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      <List.Root listStyle="none" borderTopWidth="1px" hideFrom="md">
        {props.members.map((m) => (
          <List.Item
            key={m.userId}
            display="flex"
            flexDirection="column"
            gap="2"
            py="3"
            borderBottomWidth="1px"
          >
            <Box minW="0">
              <Text fontWeight="medium">
                {m.name}
                {m.isYou && (
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    {` · ${t("you")}`}
                  </Text>
                )}
              </Text>
              <Text fontSize="xs" color="fg.muted" truncate>
                {m.email}
              </Text>
            </Box>
            <Box>
              {m.lastSignInAt ? (
                <Text fontSize="sm" color="fg.muted">
                  {t("lastSignIn", {
                    date: format.dateTime(new Date(m.lastSignInAt), { dateStyle: "medium" }),
                  })}
                </Text>
              ) : (
                <StatusTag tone="warning">{t("notSignedIn")}</StatusTag>
              )}
            </Box>
            <HStack gap="4" wrap="wrap">
              {roleControl(m, true)}
              {avControl(m, true)}
            </HStack>
            {rowActions(m)}
          </List.Item>
        ))}
      </List.Root>
      {feedback && <FormResult state={feedback.state} saved={savedLabel[feedback.kind]} />}
    </Stack>
  );
}
