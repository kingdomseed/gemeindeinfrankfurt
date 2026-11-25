"use client";

import { Button, chakra, Flex, Input, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import type { TrainingSetup } from "@/lib/coordinator";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

// Attendance sites where registrants join the training. An unused site can be
// removed as long as at least one remains.
export function TrainingSitesForm(props: { sites: TrainingSetup["sites"]; action: FormAction }) {
  const t = useTranslations("coordinator.setup");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  return (
    <Stack gap="4">
      <FormSection legend={t("sites")}>
        <Text fontSize="sm" color="fg.muted">
          {t("sitesHelp")}
        </Text>
        <List.Root listStyle="none" borderTopWidth="1px">
          {props.sites.map((s) => (
            <List.Item key={s.id} display="block" py="1" borderBottomWidth="1px">
              <Flex align="center" justify="space-between" gap="4">
                <Text>
                  {s.name}
                  {s.used > 0 && (
                    <Text as="span" color="fg.muted" fontSize="sm">
                      {` · ${t("registeredHere", { count: s.used })}`}
                    </Text>
                  )}
                </Text>
                {props.sites.length > 1 && s.used === 0 && (
                  <form action={formAction}>
                    <input type="hidden" name="intent" value={`remove:${s.id}`} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      color="fg"
                      aria-label={`${t("remove")}: ${s.name}`}
                    >
                      {t("remove")}
                    </Button>
                  </form>
                )}
              </Flex>
            </List.Item>
          ))}
        </List.Root>
        <chakra.form
          action={formAction}
          key={props.sites.length}
          display="flex"
          alignItems="flex-end"
          gap="3"
          flexWrap="wrap"
        >
          <input type="hidden" name="intent" value="add" />
          <FormField label={t("addSite")}>
            <Input name="name" maxW="sm" required />
          </FormField>
          <Button type="submit" variant="outline" color="fg" loading={pending}>
            {t("add")}
          </Button>
        </chakra.form>
      </FormSection>
      <FormResult state={state} saved={t("saved")} />
    </Stack>
  );
}
