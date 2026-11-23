"use client";

import { Box, Button, HStack, List, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import type { TeamMember } from "@/lib/team";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

// Everyone who can sign in, with a fresh sign-in link for each and, for
// admins, a way to put someone in AV or take their access away.
export function TeamList(props: {
  members: readonly TeamMember[];
  canManage: boolean;
  actions: { resend: FormAction; remove: FormAction; av: FormAction };
}) {
  const t = useTranslations("coordinator.team");
  const format = useFormatter();
  const idle: FormState = { status: "idle" };
  const [sent, resend, sending] = useActionState(props.actions.resend, idle);
  const [removed, remove, removing] = useActionState(props.actions.remove, idle);
  const [avChanged, changeAv, changingAv] = useActionState(props.actions.av, idle);
  return (
    <Stack as="section" aria-labelledby="team-heading" gap="3">
      <Text as="h2" id="team-heading" fontSize="xl" fontWeight="semibold">
        {t("whoCanSignIn")}
      </Text>
      <List.Root listStyle="none" borderTopWidth="1px">
        {props.members.map((m) => (
          <List.Item
            key={m.userId}
            display="grid"
            gridTemplateColumns={{ base: "1fr", md: "minmax(0, 2fr) minmax(0, 1.4fr) auto" }}
            columnGap="6"
            rowGap="2"
            alignItems="center"
            py="2"
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
            <HStack gap="2" wrap="wrap">
              {m.isAdmin && <StatusTag tone="brand">{t("admin")}</StatusTag>}
              {m.servesAv && <StatusTag tone="neutral">{t("av")}</StatusTag>}
              {m.lastSignInAt ? (
                <Text fontSize="sm" color="fg.muted">
                  {t("lastSignIn", {
                    date: format.dateTime(new Date(m.lastSignInAt), { dateStyle: "medium" }),
                  })}
                </Text>
              ) : (
                <StatusTag tone="warning">{t("notSignedIn")}</StatusTag>
              )}
            </HStack>
            <HStack gap="1">
              <form action={resend}>
                <input type="hidden" name="user_id" value={m.userId} />
                <Button type="submit" size="xs" variant="ghost" color="fg" disabled={sending}>
                  {t("sendLink")}
                </Button>
              </form>
              {props.canManage && (
                <form action={changeAv}>
                  <input type="hidden" name="user_id" value={m.userId} />
                  <input type="hidden" name="serves_av" value={String(!m.servesAv)} />
                  <Button
                    type="submit"
                    size="xs"
                    variant="ghost"
                    color="fg"
                    disabled={changingAv}
                    aria-label={`${m.servesAv ? t("leaveAv") : t("joinAv")}: ${m.name}`}
                  >
                    {m.servesAv ? t("leaveAv") : t("joinAv")}
                  </Button>
                </form>
              )}
              {props.canManage && !m.isYou && (
                <form action={remove}>
                  <input type="hidden" name="user_id" value={m.userId} />
                  <Button
                    type="submit"
                    size="xs"
                    variant="ghost"
                    color="fg.error"
                    disabled={removing}
                    aria-label={`${t("remove")}: ${m.name}`}
                  >
                    {t("remove")}
                  </Button>
                </form>
              )}
            </HStack>
          </List.Item>
        ))}
      </List.Root>
      <FormResult state={sent} saved={t("linkSent")} />
      <FormResult state={removed} saved={t("removed")} />
      <FormResult state={avChanged} saved={t("avChanged")} />
    </Stack>
  );
}
