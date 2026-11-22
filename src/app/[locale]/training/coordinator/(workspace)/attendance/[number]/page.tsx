import { Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PageMessage } from "@/components/ui/page-message";
import { attendanceRoster } from "@/features/coordinator/attendance-roster";
import { AttendanceTaker } from "@/features/coordinator/AttendanceTaker";
import { groupBoard } from "@/features/coordinator/group-board";
import { GroupFilter } from "@/features/coordinator/GroupFilter";
import { attendanceHref, sectionHref } from "@/features/coordinator/sections";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink, redirect } from "@/i18n/navigation";
import { loadAttendance, markKey } from "@/lib/attendance";
import { loadCoordination } from "@/lib/coordinator";
import { isRequired } from "@/lib/domain/attendance";
import { berlinDayTime } from "@/lib/domain/sessions";
import { loadStudyGroups } from "@/lib/groups";

import { saveAttendance } from "../actions";
import { groupParam } from "../group-param";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/attendance/[number]">;

const messageNumber = z.coerce.number().int().positive();

export async function generateMetadata({ params }: Props) {
  const { locale: raw, number } = await params;
  const t = await getTranslations({
    locale: requireLocale(raw),
    namespace: "coordinator.attendance",
  });
  return { title: t("titleFor", { number: messageNumber.catch(0).parse(number) }) };
}

// Taking attendance during one message, made for a phone.
export default async function TakeAttendancePage({ params, searchParams }: Props) {
  const { locale: raw, number: rawNumber } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const number = messageNumber.safeParse(rawNumber);
  if (!number.success) notFound();
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, tc, th] = await Promise.all([
    getTranslations("coordinator.attendance"),
    getTranslations("coordinator"),
    getTranslations("home"),
  ]);
  const { data, supabase } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const sessions = data.training.sessions.toSorted((a, b) => a.message_number - b.message_number);
  const index = sessions.findIndex((s) => s.message_number === number.data);
  const session = sessions[index];
  if (!session) notFound();
  const prev = sessions[index - 1];
  const next = sessions[index + 1];

  const group = groupParam.parse((await searchParams).group);
  const [groups, marks] = await Promise.all([
    loadStudyGroups(supabase, data.training.id),
    loadAttendance(supabase, data.training.id),
  ]);
  const board = groupBoard(data.registrations, groups);
  const people = attendanceRoster(data.registrations, board)
    .filter((p) => group === undefined || p.groupNumber === group)
    .map((p) => ({
      id: p.id,
      name: p.name,
      note: [
        p.groupNumber ? t("groupNumber", { number: p.groupNumber }) : null,
        p.seat === "full_time" ? null : tc(`seatShort.${p.seat}`),
      ]
        .filter(Boolean)
        .join(" · "),
      required: isRequired(p.seat, new Set(p.chosen), session.id),
    }));
  const sessionMarks = Object.fromEntries(
    people.flatMap((p) => {
      const m = marks[markKey(p.id, session.id)];
      return m ? [[p.id, m] as const] : [];
    }),
  );

  return (
    <Stack gap="4" maxW="lg" mx="auto">
      <Link asChild fontSize="sm" color="fg" textDecoration="underline" alignSelf="flex-start">
        <LocaleLink href={sectionHref("attendance")}>{t("overview")}</LocaleLink>
      </Link>
      <Flex justify="space-between" align="center" gap="2">
        <Button asChild variant="outline" color="fg" disabled={!prev} aria-label={t("previous")}>
          {prev ? (
            <LocaleLink href={attendanceHref(prev.message_number, group)}>{t("prev")}</LocaleLink>
          ) : (
            <span>{t("prev")}</span>
          )}
        </Button>
        <Stack gap="0" align="center" textAlign="center">
          <Heading as="h1" size="lg">
            {t("message", { number: session.message_number })}
          </Heading>
          <Text fontSize="sm" color="fg.muted">
            {berlinDayTime(new Date(session.starts_at), locale, th("lordsDay"))}
          </Text>
        </Stack>
        <Button asChild variant="outline" color="fg" disabled={!next} aria-label={t("nextMessage")}>
          {next ? (
            <LocaleLink href={attendanceHref(next.message_number, group)}>{t("next")}</LocaleLink>
          ) : (
            <span>{t("next")}</span>
          )}
        </Button>
      </Flex>
      <GroupFilter
        groups={board.groups.map((g) => g.number)}
        current={group ?? null}
        href={(g) => attendanceHref(session.message_number, g)}
      />
      <AttendanceTaker
        sessionId={session.id}
        people={people}
        marks={sessionMarks}
        save={saveAttendance}
      />
    </Stack>
  );
}
