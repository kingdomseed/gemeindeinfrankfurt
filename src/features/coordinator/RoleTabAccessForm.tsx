"use client";

import { Button, chakra, Checkbox, Heading, Table, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { ColumnHeader } from "@/components/ui/column-header";
import { Panel } from "@/components/ui/panel";
import { configurableRoles, type RoleTabPermissions } from "@/lib/domain/roles";

import { FormResult } from "./FormResult";
import { coordinatorSections } from "./sections";
import type { FormAction, FormState } from "./types";

// Lets admins choose which coordination tabs Coordinators and Helpers see.
// Admins themselves always keep access to every tab.
export function RoleTabAccessForm(props: { permissions: RoleTabPermissions; action: FormAction }) {
  const t = useTranslations("coordinator.team");
  const tNav = useTranslations("coordinator.nav");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  const versionKey = `${props.permissions.coordinator.join(",")}|${props.permissions.helper.join(",")}`;
  const checkedByRole = {
    coordinator: new Set(props.permissions.coordinator),
    helper: new Set(props.permissions.helper),
  };

  return (
    <Panel aria-labelledby="tab-access-heading">
      <Heading as="h2" id="tab-access-heading" size="lg">
        {t("tabAccessTitle")}
      </Heading>
      <Text fontSize="sm" color="fg.muted">
        {t("tabAccessHelp")}
      </Text>
      <chakra.form
        key={versionKey}
        action={formAction}
        display="flex"
        flexDirection="column"
        gap="4"
      >
        <Table.ScrollArea>
          <Table.Root
            size="sm"
            variant="line"
            css={{
              "& th, & td": { px: "1" },
              "& th:first-of-type, & td:first-of-type": { ps: "0" },
              "& th:last-of-type, & td:last-of-type": { pe: "0" },
              "@media (min-width: 30em)": {
                "& th, & td": { px: "3" },
                "& th:first-of-type, & td:first-of-type": { ps: "3" },
                "& th:last-of-type, & td:last-of-type": { pe: "3" },
              },
            }}
          >
            <Table.Header>
              <Table.Row bg="transparent">
                <ColumnHeader>{t("tabColumn")}</ColumnHeader>
                {configurableRoles.map((role) => (
                  <ColumnHeader key={role}>{t(`roles.${role}`)}</ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {coordinatorSections.map((s) => (
                <Table.Row key={s.key} bg="transparent">
                  <Table.Cell as="th" scope="row" fontWeight="normal">
                    <Text fontWeight="medium">{tNav(s.key)}</Text>
                    {s.key === "messages" && (
                      <Text fontSize="xs" color="fg.muted">
                        {t("messagesHint")}
                      </Text>
                    )}
                  </Table.Cell>
                  {configurableRoles.map((role) => (
                    <Table.Cell key={role}>
                      <Checkbox.Root
                        name={role}
                        value={s.key}
                        defaultChecked={checkedByRole[role].has(s.key)}
                        disabled={pending}
                        cursor={pending ? "not-allowed" : "pointer"}
                      >
                        <Checkbox.HiddenInput
                          aria-label={`${tNav(s.key)} — ${t(`roles.${role}`)}`}
                        />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
        <Button type="submit" alignSelf="flex-start" loading={pending}>
          {t("saveTabAccess")}
        </Button>
      </chakra.form>
      <FormResult state={state} saved={t("tabAccessSaved")} />
    </Panel>
  );
}
