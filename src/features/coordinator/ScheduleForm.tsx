"use client";

import { Button, chakra, Checkbox, HStack, Input, Table, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { ColumnHeader } from "@/components/ui/column-header";
import { FormSection } from "@/components/ui/form-section";
import type { TrainingSetup } from "@/lib/coordinator";
import { toBerlinWallTime } from "@/lib/domain/berlin-time";
import { scheduleFingerprint } from "@/lib/domain/list-sync";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";
import { useCollaborativeForm } from "./useCollaborativeForm";

type SessionRow = TrainingSetup["sessions"][number];

function toScheduleDraft(sessions: readonly SessionRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of sessions) {
    const start = toBerlinWallTime(new Date(s.starts_at));
    const end = toBerlinWallTime(new Date(s.ends_at));
    out[`date_${s.id}`] = start.date;
    out[`start_${s.id}`] = start.time;
    out[`end_${s.id}`] = end.time;
    out[`tested_${s.id}`] = s.is_tested ? "on" : "";
  }
  return out;
}

function ScheduleEditor(props: { sessions: readonly SessionRow[]; action: FormAction }) {
  const t = useTranslations("coordinator.setup");
  const [structState, structAction, structPending] = useActionState<FormState, FormData>(
    props.action,
    { status: "idle" },
  );
  const collab = useCollaborativeForm({
    server: toScheduleDraft(props.sessions),
    version: scheduleFingerprint(props.sessions),
    action: props.action,
  });

  const fieldLabels: Record<string, string> = {};
  for (const s of props.sessions) {
    const prefix = `${t("message")} ${s.message_number}`;
    fieldLabels[`date_${s.id}`] = `${prefix} · ${t("date")}`;
    fieldLabels[`start_${s.id}`] = `${prefix} · ${t("start")}`;
    fieldLabels[`end_${s.id}`] = `${prefix} · ${t("end")}`;
    fieldLabels[`tested_${s.id}`] = `${prefix} · ${t("tested")}`;
  }

  return (
    <>
      <form id="add-session" action={structAction} hidden>
        <input type="hidden" name="intent" value="add" />
      </form>
      {props.sessions.slice(-1).map((s) => (
        <form key={s.id} id={`remove-${s.id}`} action={structAction} hidden>
          <input type="hidden" name="intent" value={`remove:${s.id}`} />
        </form>
      ))}
      <chakra.form onSubmit={collab.submit} display="flex" flexDirection="column" gap="4">
        <input type="hidden" name="intent" value="save" />
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
                  const label = (field: string) => `${field}, ${t("message")} ${s.message_number}`;
                  const dateKey = `date_${s.id}`;
                  const startKey = `start_${s.id}`;
                  const endKey = `end_${s.id}`;
                  const testedKey = `tested_${s.id}`;
                  return (
                    <Table.Row key={s.id} bg="transparent">
                      <Table.Cell as="th" scope="row" fontWeight="normal">
                        {s.message_number}
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          type="date"
                          name={dateKey}
                          value={collab.draft[dateKey] ?? ""}
                          onChange={(e) => collab.edit(dateKey, e.currentTarget.value)}
                          aria-label={label(t("date"))}
                          w="44"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          type="time"
                          name={startKey}
                          value={collab.draft[startKey] ?? ""}
                          onChange={(e) => collab.edit(startKey, e.currentTarget.value)}
                          aria-label={label(t("start"))}
                          w="28"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          type="time"
                          name={endKey}
                          value={collab.draft[endKey] ?? ""}
                          onChange={(e) => collab.edit(endKey, e.currentTarget.value)}
                          aria-label={label(t("end"))}
                          w="28"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Checkbox.Root
                          name={testedKey}
                          checked={collab.draft[testedKey] === "on"}
                          onCheckedChange={(e) =>
                            collab.edit(testedKey, e.checked === true ? "on" : "")
                          }
                        >
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
                            disabled={s.picked > 0 || structPending}
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
        <ConflictBanner {...collab.bannerProps} fieldLabels={fieldLabels} />
        <HStack gap="3" wrap="wrap">
          <Button type="submit" loading={collab.pending}>
            {t("saveSchedule")}
          </Button>
          <Button
            type="submit"
            form="add-session"
            variant="outline"
            color="fg"
            loading={structPending}
          >
            {t("addMessage")}
          </Button>
        </HStack>
        <FormResult state={collab.result} saved={t("saved")} />
        {structState.status !== "idle" && <FormResult state={structState} saved={t("saved")} />}
      </chakra.form>
    </>
  );
}

// Each message's date, start and end in Frankfurt time, and whether it is
// tested. Remounts only when sessions are added/removed; edits merge live.
export function ScheduleForm(props: { sessions: TrainingSetup["sessions"]; action: FormAction }) {
  return (
    <ScheduleEditor
      key={props.sessions.map((s) => s.id).join(",")}
      sessions={props.sessions}
      action={props.action}
    />
  );
}
