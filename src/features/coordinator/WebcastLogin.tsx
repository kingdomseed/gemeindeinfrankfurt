"use client";

import { Box, Button, chakra, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useState, useTransition } from "react";

import { CopyButton } from "@/components/ui/copy-button";
import { FormField } from "@/components/ui/form-field";
import type { WebcastLogin as Login } from "@/lib/services";

import { FormResult } from "./FormResult";
import { LoginRow } from "./LoginRow";
import type { FormAction, FormState } from "./types";

// The Lebensstrom webcast login, for coordinators serving in AV. The password
// stays hidden until someone presses Show, and each time is logged.
export function WebcastLogin(props: {
  login: Login | null;
  reveal: () => Promise<string | null>;
  save: FormAction;
}) {
  const t = useTranslations("coordinator.services");
  const format = useFormatter();
  const [password, setPassword] = useState<string | null>(null);
  const [revealing, startReveal] = useTransition();
  const [editing, setEditing] = useState(props.login === null);
  const [state, save, saving] = useActionState<FormState, FormData>(
    async (prev, form) => {
      const result = await props.save(prev, form);
      if (result.status === "saved") {
        setEditing(false);
        setPassword(null);
      }
      return result;
    },
    { status: "idle" },
  );
  const login = props.login;

  return (
    <Stack gap="3" bg="bg.subtle" rounded="xl" p="5">
      <Text fontSize="sm">{t("webcastHelp")}</Text>
      {login && !editing && (
        <>
          <Box as="dl">
            <LoginRow label={t("website")}>{login.website}</LoginRow>
            <LoginRow label={t("userName")}>
              <HStack gap="3" wrap="wrap">
                <Text fontFamily="mono" translate="no">
                  {login.userName}
                </Text>
                <CopyButton value={login.userName} label={t("copy")} copiedLabel={t("copied")} />
              </HStack>
            </LoginRow>
            <LoginRow label={t("password")} last>
              <HStack gap="3" wrap="wrap">
                {password === null ? (
                  <>
                    <Text fontFamily="mono" aria-label={t("hidden")}>
                      ••••••••••
                    </Text>
                    <Button
                      variant="outline"
                      size="xs"
                      minH="8"
                      loading={revealing}
                      onClick={() =>
                        startReveal(async () => {
                          setPassword(await props.reveal());
                        })
                      }
                    >
                      {t("show")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Text fontFamily="mono" translate="no">
                      {password}
                    </Text>
                    <CopyButton value={password} label={t("copy")} copiedLabel={t("copied")} />
                    <Button variant="outline" size="xs" minH="8" onClick={() => setPassword(null)}>
                      {t("hide")}
                    </Button>
                  </>
                )}
              </HStack>
            </LoginRow>
          </Box>
          <Text fontSize="xs" color="fg.muted">
            {t("lastChanged", {
              name: login.changedBy || "?",
              date: format.dateTime(new Date(login.changedAt), { dateStyle: "medium" }),
            })}
          </Text>
          <Button
            variant="outline"
            color="fg"
            alignSelf="flex-start"
            onClick={() => setEditing(true)}
          >
            {t("updateLogin")}
          </Button>
        </>
      )}
      {editing && (
        <chakra.form action={save} display="flex" flexDirection="column" gap="3" maxW="md">
          <FormField label={t("website")}>
            <Input
              name="website"
              type="url"
              defaultValue={login?.website}
              required
              maxLength={500}
              spellCheck={false}
            />
          </FormField>
          <FormField label={t("userName")}>
            <Input
              name="user_name"
              defaultValue={login?.userName}
              required
              maxLength={200}
              autoComplete="off"
              spellCheck={false}
            />
          </FormField>
          <FormField label={t("password")} help={login ? t("passwordKeep") : undefined}>
            <Input
              name="password"
              type="password"
              required={!login}
              maxLength={200}
              autoComplete="new-password"
            />
          </FormField>
          <HStack gap="3">
            <Button type="submit" loading={saving}>
              {t("saveLogin")}
            </Button>
            {login && (
              <Button variant="ghost" color="fg" onClick={() => setEditing(false)}>
                {t("cancel")}
              </Button>
            )}
          </HStack>
        </chakra.form>
      )}
      <FormResult state={state} saved={t("loginSaved")} />
    </Stack>
  );
}
