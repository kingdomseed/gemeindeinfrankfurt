import { Button, Flex, Link, Stack, Table, Text } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeading } from "@/components/ui/page-heading";
import { PageMessage } from "@/components/ui/page-message";
import { StatusTag } from "@/components/ui/status-tag";
import { attendanceRoster } from "@/features/coordinator/attendance-roster";
import { AttendanceCell } from "@/features/coordinator/AttendanceCell";
import { detailHref } from "@/features/coordinator/display";
import { groupBoard } from "@/features/coordinator/group-board";
import { GroupFilter } from "@/features/coordinator/GroupFilter";
import { attendanceHref, sectionHref } from "@/features/coordinator/sections";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink, redirect } from "@/i18n/navigation";
import { loadAttendance, markKey } from "@/lib/attendance";
import { loadCoordination } from "@/lib/coordinator";
import { absenceCount, currentSession, isRequired, MAX_ABSENCES } from "@/lib/domain/attendance";
import { loadStudyGroups } from "@/lib/groups";

import { setAttendanceMark } from "./actions";
import { groupParam } from "./group-param";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/attendance">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.attendance" });
  return { title: t("title") };
}

export default async function AttendanceOverviewPage({ params, searchParams }: Props) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, tc, th] = await Promise.all([
    getTranslations("coordinator.attendance"),
    getTranslations("coordinator"),
    getTranslations("home"),
  ]);
  const { data, supabase, now } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const group = groupParam.parse((await searchParams).group);
  const [groups, marks] = await Promise.all([
    loadStudyGroups(supabase, data.training.id),
    loadAttendance(supabase, data.training.id),
  ]);
  const board = groupBoard(data.registrations, groups);
  const roster = attendanceRoster(data.registrations, board).filter(
    (p) => group === undefined || p.groupNumber === group,
  );
  const sessions = data.training.sessions.toSorted((a, b) => a.message_number - b.message_number);
  const taken = new Set(Object.keys(marks).map((key) => key.split(":")[1]));
  const takenCount = sessions.filter((s) => taken.has(s.id)).length;
  const next = currentSession(sessions, now);

  return (
    <Stack gap="8">
      <Flex justify="space-between" align="flex-end" gap="4" wrap="wrap">
        <PageHeading
          title={t("title")}
          subtitle={t("taken", { taken: takenCount, total: sessions.length })}
        />
        {next && (
          <Button asChild>
            <LocaleLink href={attendanceHref(next.message_number, group)}>
              {t("takeFor", { number: next.message_number })}
            </LocaleLink>
          </Button>
        )}
      </Flex>
      <Flex justify="space-between" align="flex-end" gap="4" wrap="wrap">
        <GroupFilter
          groups={board.groups.map((g) => g.number)}
          current={group ?? null}
          href={(g) => (g ? `${sectionHref("attendance")}?group=${g}` : sectionHref("attendance"))}
        />
        <Text fontSize="sm" color="fg.muted" maxW="xl">
          {t("legend")}
        </Text>
      </Flex>
      <Table.ScrollArea borderWidth="1px" rounded="md">
        <Table.Root size="sm" minW="4xl">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{tc("name")}</Table.ColumnHeader>
              {sessions.map((s) => (
                <Table.ColumnHeader key={s.id} textAlign="center" w="11">
                  {s.message_number}
                </Table.ColumnHeader>
              ))}
              <Table.ColumnHeader textAlign="end">{t("absences")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {roster.map((p) => {
              const chosen = new Set(p.chosen);
              const own = new Map(
                sessions.flatMap((s) => {
                  const m = marks[markKey(p.id, s.id)];
                  return m ? [[s.id, m] as const] : [];
                }),
              );
              const absences = absenceCount(p.seat, chosen, own);
              return (
                <Table.Row key={p.id}>
                  <Table.Cell>
                    <Link asChild color="fg" textDecoration="underline" fontWeight="medium">
                      <LocaleLink href={detailHref(p.id)}>{p.name}</LocaleLink>
                    </Link>
                    <Text fontSize="xs" color="fg.muted">
                      {[
                        p.groupNumber ? t("groupNumber", { number: p.groupNumber }) : null,
                        p.seat === "full_time" ? null : tc(`seatShort.${p.seat}`),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </Table.Cell>
                  {sessions.map((s) => (
                    <Table.Cell key={s.id} textAlign="center" p="1">
                      <AttendanceCell
                        mark={own.get(s.id) ?? null}
                        required={isRequired(p.seat, chosen, s.id)}
                        label={`${p.name}, ${t("message", { number: s.message_number })}`}
                        save={setAttendanceMark.bind(null, p.id, s.id)}
                      />
                    </Table.Cell>
                  ))}
                  <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                    {absences > MAX_ABSENCES ? (
                      <StatusTag tone="warning">{absences}</StatusTag>
                    ) : (
                      absences
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      <Text fontSize="sm" color="fg.muted">
        {t("partTimeNote")}
      </Text>
    </Stack>
  );
}
