import { Button, Flex, Grid, Heading, HStack, List, Stack, Table, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { DetailItem } from "@/components/ui/detail-item";
import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusTag } from "@/components/ui/status-tag";
import { Link as LocaleLink } from "@/i18n/navigation";

import { CostForm } from "./CostForm";
import { CostList, type CostRow } from "./CostList";
import { ReportDetailsForm } from "./ReportDetailsForm";
import type { FormAction } from "./types";
import { WorkspaceSection } from "./WorkspaceSection";
import { YesNoQuestion } from "./YesNoQuestion";

export type ReportQuestionRow = {
  key: string;
  label: string;
  value: boolean;
  suggested: boolean;
  labels: { yes: string; no: string };
  answer: (value: boolean) => Promise<void>;
};

// The report to Lebensstrom, filled in as the training runs: the numbers,
// the dates, the questions, absences per message, and the costs.
export function ReportWorkspace(props: {
  questionnaireHref: string;
  due: { date: string; note: string } | null;
  stats: readonly { label: string; value: string; help?: string | undefined }[];
  localities: string | null;
  dates: { first: string; last: string };
  details: {
    notes: string;
    firstDay: string | null;
    lastDay: string | null;
    updatedAt: string;
    save: FormAction;
  };
  questions: readonly ReportQuestionRow[];
  messages: readonly { number: number; date: string; absent: number }[];
  overLimit: readonly { id: string; name: string; unexcused: number; excused: number }[];
  costs: {
    rows: readonly CostRow[];
    total: string;
    add: FormAction;
    remove: (form: FormData) => Promise<void>;
  };
}) {
  const t = useTranslations("coordinator.report");
  return (
    <Stack gap="10" maxW="3xl">
      <Flex justify="space-between" align="flex-end" gap="4" wrap="wrap">
        <PageHeading title={t("title")} subtitle={t("lead")} />
        <Button asChild>
          <LocaleLink href={props.questionnaireHref}>{t("printQuestionnaire")}</LocaleLink>
        </Button>
      </Flex>

      {props.due && (
        <Notice tone="warning">
          <Text as="span" display="block" fontWeight="medium">
            {t("dueTitle", { date: props.due.date })}
          </Text>
          {props.due.note}
        </Notice>
      )}

      <WorkspaceSection
        title={t("numbers")}
        {...(props.localities ? { help: props.localities } : {})}
      >
        <Grid templateColumns="repeat(auto-fit, minmax(12rem, 1fr))" gap="3">
          {props.stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} help={s.help} />
          ))}
        </Grid>
      </WorkspaceSection>

      <WorkspaceSection title={t("dates")} help={t("datesHelp")}>
        <Grid as="dl" templateColumns="auto minmax(0, 1fr)" columnGap="6" rowGap="1">
          <DetailItem label={t("firstDay")}>{props.dates.first}</DetailItem>
          <DetailItem label={t("lastDay")}>{props.dates.last}</DetailItem>
        </Grid>
      </WorkspaceSection>

      <WorkspaceSection title={t("questions")} help={t("questionsHelp")}>
        <Stack gap="0" borderTopWidth="1px">
          {props.questions.map((q) => (
            <YesNoQuestion
              key={q.key}
              label={q.label}
              value={q.value}
              suggested={q.suggested}
              suggestedLabel={t("suggested")}
              labels={q.labels}
              answer={q.answer}
            />
          ))}
        </Stack>
        <ReportDetailsForm
          initialNotes={props.details.notes}
          initialFirstDay={props.details.firstDay}
          initialLastDay={props.details.lastDay}
          updatedAt={props.details.updatedAt}
          save={props.details.save}
        />
      </WorkspaceSection>

      <WorkspaceSection title={t("messagesTitle")}>
        <Table.ScrollArea>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t("message")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("dateShown")}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">{t("absent")}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {props.messages.map((m) => (
                <Table.Row key={m.number}>
                  <Table.Cell fontVariantNumeric="tabular-nums">{m.number}</Table.Cell>
                  <Table.Cell>{m.date}</Table.Cell>
                  <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                    {m.absent}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </WorkspaceSection>

      <WorkspaceSection title={t("overLimitTitle")} help={t("overLimitHelp")}>
        {props.overLimit.length === 0 ? (
          <Text color="fg.muted">{t("nobodyOverLimit")}</Text>
        ) : (
          <List.Root listStyle="none" borderTopWidth="1px">
            {props.overLimit.map((p) => (
              <List.Item
                key={p.id}
                display="flex"
                justifyContent="space-between"
                gap="4"
                py="2"
                borderBottomWidth="1px"
              >
                <Text>{p.name}</Text>
                <HStack gap="2">
                  {p.unexcused > 0 && (
                    <StatusTag tone="warning">{t("unexcused", { count: p.unexcused })}</StatusTag>
                  )}
                  {p.excused > 2 && <StatusTag>{t("excused", { count: p.excused })}</StatusTag>}
                </HStack>
              </List.Item>
            ))}
          </List.Root>
        )}
      </WorkspaceSection>

      <WorkspaceSection title={t("costsTitle")} help={t("costsHelp")}>
        <CostList costs={props.costs.rows} total={props.costs.total} remove={props.costs.remove} />
        <Heading as="h3" size="md">
          {t("addCostTitle")}
        </Heading>
        <CostForm add={props.costs.add} />
      </WorkspaceSection>
    </Stack>
  );
}
