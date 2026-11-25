import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { MessageWorkspace } from "@/features/coordinator/MessageWorkspace";
import { requireLocale } from "@/i18n/locale";
import { messageReadiness } from "@/lib/domain/messages";
import { berlinDay, berlinDayTime } from "@/lib/domain/sessions";
import { loadStudyGroups } from "@/lib/groups";
import { loadMessages } from "@/lib/messages";
import { loadTestSchedule } from "@/lib/testing";

import { requireActiveWorkspace } from "../../workspace";
import { saveMessageHymns, saveMessageVerses } from "../actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/messages/[number]">;

const messageNumber = z.coerce.number().int().positive();

export async function generateMetadata({ params }: Props) {
  const { locale: raw, number } = await params;
  const t = await getTranslations({
    locale: requireLocale(raw),
    namespace: "coordinator.messages",
  });
  return { title: t("titleFor", { number: messageNumber.catch(0).parse(number) }) };
}

// One message's hymns and verses, beside the list of all messages.
export default async function MessagePage({ params }: Props) {
  const { locale: raw, number: rawNumber } = await params;
  const ws = await requireActiveWorkspace(raw);
  const number = messageNumber.safeParse(rawNumber);
  if (!number.success) notFound();
  if (!ws.ok) return ws.fallback;
  const { locale, data, supabase } = ws.workspace;
  const [t, th, messages, schedule, groups] = await Promise.all([
    getTranslations("coordinator.messages"),
    getTranslations("home"),
    loadMessages(supabase, data.training.id),
    loadTestSchedule(supabase, data.training.id),
    loadStudyGroups(supabase, data.training.id),
  ]);
  const message = messages.find((m) => m.messageNumber === number.data);
  if (!message) notFound();
  const testGroupId = schedule.find((s) => s.sessionId === message.sessionId)?.groupId;
  const testGroup = groups.find((g) => g.id === testGroupId);
  const when = berlinDayTime(new Date(message.startsAt), locale, th("lordsDay"));

  return (
    <MessageWorkspace
      messages={messages.map((m) => ({
        number: m.messageNumber,
        day: berlinDay(new Date(m.startsAt), locale, th("lordsDay")),
        readiness: messageReadiness(m.hymns, m.verses),
      }))}
      message={{
        sessionId: message.sessionId,
        number: message.messageNumber,
        when: testGroup ? t("whenWithTest", { when, group: testGroup.number }) : when,
        hymns: message.hymns,
        verses: message.verses,
      }}
      actions={{
        saveHymns: saveMessageHymns.bind(null, message.sessionId),
        saveVerses: saveMessageVerses.bind(null, message.sessionId),
      }}
    />
  );
}
