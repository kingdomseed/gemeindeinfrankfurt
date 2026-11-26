"use client";

import { Button, chakra, Heading, Input, SimpleGrid, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { SelectField } from "@/components/ui/select-field";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

// Admins add a team member by name, email, and role; they get a sign-in link, no password.
export function AddCoordinatorForm(props: { action: FormAction }) {
  const t = useTranslations("coordinator.team");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  return (
    <Panel tone="brand" aria-labelledby="add-heading">
      <Heading as="h2" id="add-heading" size="lg">
        {t("addTitle")}
      </Heading>
      <chakra.form
        action={formAction}
        key={state.status === "saved" ? "sent" : "open"}
        display="flex"
        flexDirection="column"
        gap="4"
      >
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
          <FormField label={t("name")} required>
            <Input name="name" autoComplete="off" />
          </FormField>
          <FormField label={t("email")} required>
            <Input name="email" type="email" autoComplete="off" spellCheck={false} />
          </FormField>
        </SimpleGrid>
        <SelectField label={t("role")} field={{ name: "role", defaultValue: "coordinator" }}>
          <option value="coordinator">{t("roles.coordinator")}</option>
          <option value="helper">{t("roles.helper")}</option>
          <option value="admin">{t("roles.admin")}</option>
        </SelectField>
        <Text fontSize="sm" color="fg.muted">
          {t("roleHelp")}
        </Text>
        <Button type="submit" alignSelf="flex-start" loading={pending}>
          {t("invite")}
        </Button>
        <Text fontSize="sm" color="fg.muted">
          {t("inviteHelp")}
        </Text>
      </chakra.form>
      <FormResult state={state} saved={t("invited")} />
    </Panel>
  );
}
