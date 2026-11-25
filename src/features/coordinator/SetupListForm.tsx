"use client";

import { Button, chakra, Flex, Input, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

export type SetupListItem = {
  id: string;
  name: string;
  used: number;
  removable: boolean;
};

// Shared add/remove list editor for setup collections (localities and attendance sites).
export function SetupListForm(props: {
  legend: string;
  help: string;
  addLabel: string;
  items: readonly SetupListItem[];
  action: FormAction;
}) {
  const t = useTranslations("coordinator.setup");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  return (
    <Stack gap="4">
      <FormSection legend={props.legend}>
        <Text fontSize="sm" color="fg.muted">
          {props.help}
        </Text>
        <List.Root listStyle="none" borderTopWidth="1px">
          {props.items.map((item) => (
            <List.Item key={item.id} display="block" py="1" borderBottomWidth="1px">
              <Flex align="center" justify="space-between" gap="4">
                <Text>
                  {item.name}
                  {item.used > 0 && (
                    <Text as="span" color="fg.muted" fontSize="sm">
                      {` · ${t("registeredHere", { count: item.used })}`}
                    </Text>
                  )}
                </Text>
                {item.removable && (
                  <form action={formAction}>
                    <input type="hidden" name="intent" value={`remove:${item.id}`} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      color="fg"
                      aria-label={`${t("remove")}: ${item.name}`}
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
          key={props.items.length}
          display="flex"
          alignItems="flex-end"
          gap="3"
          flexWrap="wrap"
        >
          <input type="hidden" name="intent" value="add" />
          <FormField label={props.addLabel}>
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
