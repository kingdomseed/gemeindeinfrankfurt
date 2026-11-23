"use client";

import { Button, chakra, Checkbox, HStack, Input, Table, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { ColumnHeader } from "@/components/ui/column-header";
import { FormSection } from "@/components/ui/form-section";
import type { TrainingSetup } from "@/lib/coordinator";
import { toBerlinWallTime } from "@/lib/domain/berlin-time";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

// Each message's date, start and end in Frankfurt time, and whether it is
// tested. The registration form shows the schedule in all three languages
// from these times. One action takes the submit button's `intent`: save,
// add a message, or remove one.
export function ScheduleForm(props: { sessions: TrainingSetup["sessions"]; action: FormAction }) {
  const t = useTranslations("coordinator.setup");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  // Only the last message can be removed. Its button belongs to this small
  // form (through its `form` attribute), so Enter in a field always saves.
  return (
    <>
      {props.sessions.slice(-1).map((s) => (
        <form key={s.id} id={`remove-${s.id}`} action={formAction} hidden>
          <input type="hidden" name="intent" value={`remove:${s.id}`} />
        </form>
      ))}
      <chakra.form
        action={formAction}
        key={props.sessions.map((s) => s.id + s.starts_at + s.ends_at + s.is_tested).join()}
        display="flex"
        flexDirection="column"
        gap="4"
      >
        <FormSection legend={t("schedule")}>
          <Text fontSize="sm" color="fg.muted">
            {t("scheduleHelp")}
          </Text>
          <Table.ScrollArea>
            <Table.Root size="sm" variant="line" fontVariantNumeric="tabular-nums">
              <Table.Header>
                <Table.Row bg="transparent">
                  <ColumnHeader>{t("message")}</ColumnHeader>
                  <ColumnHeader>{t("date")}</ColumnHeader>
                  <ColumnHeader>{t("start")}</ColumnHeader>
                  <ColumnHeader>{t("end")}</ColumnHeader>
                  <ColumnHeader>{t("tested")}</ColumnHeader>
                  <ColumnHeader>
                    <chakra.span srOnly>{t("actions")}</chakra.span>
                  </ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {props.sessions.map((s, i) => {
                  const last = i === props.sessions.length - 1;
                  const start = toBerlinWallTime(new Date(s.starts_at));
                  const end = toBerlinWallTime(new Date(s.ends_at));
                  const label = (field: string) => `${field}, ${t("message")} ${s.message_number}`;
                  return (
                    <Table.Row key={s.id} bg="transparent">
                      <Table.Cell as="th" scope="row" fontWeight="normal">
                        {s.message_number}
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          type="date"
                          name={`date_${s.id}`}
                          defaultValue={start.date}
                          aria-label={label(t("date"))}
                          w="44"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          type="time"
                          name={`start_${s.id}`}
                          defaultValue={start.time}
                          aria-label={label(t("start"))}
                          w="28"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          type="time"
                          name={`end_${s.id}`}
                          defaultValue={end.time}
                          aria-label={label(t("end"))}
                          w="28"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Checkbox.Root name={`tested_${s.id}`} defaultChecked={s.is_tested}>
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label srOnly>{label(t("tested"))}</Checkbox.Label>
                        </Checkbox.Root>
                      </Table.Cell>
                      <Table.Cell>
                        {last && (
                          <Button
                            type="submit"
                            form={`remove-${s.id}`}
                            variant="ghost"
                            size="sm"
                            color="fg"
                            disabled={s.picked > 0}
                            title={s.picked > 0 ? t("cannotRemove") : undefined}
                          >
                            {t("remove")}
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </FormSection>
        <HStack gap="3" wrap="wrap">
          <Button type="submit" name="intent" value="save" loading={pending}>
            {t("saveSchedule")}
          </Button>
          <Button type="submit" name="intent" value="add" variant="outline" color="fg">
            {t("addMessage")}
          </Button>
        </HStack>
        <FormResult state={state} saved={t("saved")} />
      </chakra.form>
    </>
  );
}
