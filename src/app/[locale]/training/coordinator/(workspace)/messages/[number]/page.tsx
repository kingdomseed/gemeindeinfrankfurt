import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PageHeading } from "@/components/ui/page-heading";
import { PageMessage } from "@/components/ui/page-message";
import { HymnsForm } from "@/features/coordinator/HymnsForm";
import { HymnTable } from "@/features/coordinator/HymnTable";
import { MessageEditor } from "@/features/coordinator/MessageEditor";
import { MessageList } from "@/features/coordinator/MessageList";
import { screenHref } from "@/features/coordinator/sections";
import { VerseList } from "@/features/coordinator/VerseList";
import { VersesForm } from "@/features/coordinator/VersesForm";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink, redirect } from "@/i18n/navigation";
import { loadCoordination } from "@/lib/coordinator";
import { messageReadiness } from "@/lib/domain/messages";
import { berlinDay, berlinDayTime } from "@/lib/domain/sessions";
import { loadStudyGroups } from "@/lib/groups";
import { loadMessages } from "@/lib/messages";
import { loadTestSchedule } from "@/lib/testing";

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
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const number = messageNumber.safeParse(rawNumber);
  if (!number.success) notFound();
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, th] = await Promise.all([
    getTranslations("coordinator.messages"),
    getTranslations("home"),
  ]);
  const { data, supabase } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const [messages, schedule, groups] = await Promise.all([
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
    <Stack gap="8">
      <Flex justify="space-between" align="flex-end" gap="4" wrap="wrap">
        <PageHeading title={t("title")} subtitle={t("lead")} />
        <Button asChild>
          <LocaleLink href={screenHref(message.messageNumber)}>{t("openOnScreen")}</LocaleLink>
        </Button>
      </Flex>
      <Flex wrap="wrap" gap="8" align="flex-start">
        <Box as="nav" aria-label={t("listLabel")} flex="1 1 13.75rem" maxW={{ md: "17.5rem" }}>
          <MessageList
            current={message.messageNumber}
            messages={messages.map((m) => ({
              number: m.messageNumber,
              day: berlinDay(new Date(m.startsAt), locale, th("lordsDay")),
              readiness: messageReadiness(m.hymns, m.verses),
            }))}
          />
        </Box>
        <Stack flex="999 1 35rem" minW="0" gap="10">
          <Stack gap="1">
            <Heading as="h2" size="xl">
              {t("message", { number: message.messageNumber })}
            </Heading>
            <Text color="fg.muted" fontVariantNumeric="tabular-nums">
              {testGroup ? t("whenWithTest", { when, group: testGroup.number }) : when}
            </Text>
          </Stack>
          <MessageEditor
            key={message.sessionId}
            number={message.messageNumber}
            read={
              <Stack gap="10">
                <Stack as="section" gap="3">
                  <Heading as="h3" size="md">
                    {t("hymns")}
                  </Heading>
                  <HymnTable hymns={message.hymns} />
                </Stack>
                <Stack as="section" gap="3">
                  <Heading as="h3" size="md">
                    {t("verses")}
                  </Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {t("versesHelp")}
                  </Text>
                  <VerseList verses={message.verses} />
                  <Button asChild variant="ghost" color="fg" alignSelf="flex-start">
                    <LocaleLink href={screenHref(message.messageNumber)}>
                      {t("previewSlides")}
                    </LocaleLink>
                  </Button>
                </Stack>
              </Stack>
            }
            edit={
              <Stack gap="10">
                <Stack as="section" gap="3">
                  <Heading as="h3" size="md">
                    {t("hymns")}
                  </Heading>
                  <HymnsForm
                    initialHymns={message.hymns}
                    action={saveMessageHymns.bind(null, message.sessionId)}
                  />
                </Stack>
                <Stack as="section" gap="3">
                  <Heading as="h3" size="md">
                    {t("verses")}
                  </Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {t("versesHelp")}
                  </Text>
                  <VersesForm
                    initialVerses={message.verses}
                    action={saveMessageVerses.bind(null, message.sessionId)}
                  />
                </Stack>
              </Stack>
            }
          />
        </Stack>
      </Flex>
    </Stack>
  );
}
