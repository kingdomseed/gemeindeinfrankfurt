import { Container, Stack } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PageMessage } from "@/components/ui/page-message";
import { mainContentId } from "@/components/ui/skip-link";
import { LiveScreenSync } from "@/features/coordinator/LiveScreenSync";
import { SharedScreenHeader } from "@/features/coordinator/SharedScreenHeader";
import { buildMessageSlides } from "@/features/coordinator/slides";
import { SlideShow } from "@/features/coordinator/SlideShow";
import { MainColumn } from "@/features/shell/MainColumn";
import { requireLocale } from "@/i18n/locale";
import { berlinDay } from "@/lib/domain/sessions";
import { loadSharedTrainingByToken, screenContentVersion } from "@/lib/messages";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/screen/[token]/[number]">;

const messageNumber = z.coerce.number().int().positive();

export async function generateMetadata({ params }: Props) {
  const { locale: raw, number } = await params;
  const t = await getTranslations({ locale: requireLocale(raw), namespace: "coordinator.screen" });
  return {
    title: t("titleFor", { number: messageNumber.catch(0).parse(number) }),
    robots: { index: false, follow: false },
  };
}

// Account-free live screen for one message: rules, hymns, and trilingual
// verses (DE / EN / RU together on one slide), kept updated as coordinators type.
export default async function SharedScreenMessagePage({ params }: Props) {
  const { locale: raw, token, number: rawNumber } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);

  const number = messageNumber.safeParse(rawNumber);
  if (!number.success) notFound();

  const [t, tm, tr, th, tl, shared] = await Promise.all([
    getTranslations("coordinator.screen"),
    getTranslations("coordinator.messages"),
    getTranslations("register"),
    getTranslations("home"),
    getTranslations("common.languages"),
    loadSharedTrainingByToken(token),
  ]);
  if (!shared) {
    return (
      <MainColumn>
        <PageMessage title={t("invalidLink")} body={t("invalidLinkBody")} />
      </MainColumn>
    );
  }

  const message = shared.sessions.find((s) => s.messageNumber === number.data);
  if (!message) notFound();

  const { slides, sections } = buildMessageSlides({
    locale,
    hymns: message.hymns,
    verses: message.verses,
    labels: {
      rulesSection: t("rules"),
      hymnsSection: tm("hymns"),
      versesSection: tm("verses"),
      ruleMeta: (index, total) => t("ruleMeta", { number: index, total }),
      hymnMeta: (index, total) => t("hymnMeta", { number: index, total }),
      verseMeta: (index, total) => t("verseMeta", { number: index, total }),
      ruleText: (key) => tr(key),
      hymnTitle: (n) => t("hymn", { number: n }),
      hymnInTitle: (n, language) => t("hymnIn", { number: n, language }),
      notIn: (language) => tm("notIn", { language }),
      verseMissing: (language) => t("verseMissing", { language }),
      languageNames: { de: tl("de"), en: tl("en"), ru: tl("ru") },
    },
  });

  const version = screenContentVersion(message.hymns, message.verses);

  return (
    <Container
      as="main"
      id={mainContentId}
      tabIndex={-1}
      maxW="6xl"
      pt={{ base: "4", md: "6" }}
      pb="16"
    >
      <Stack gap="4">
        <LiveScreenSync token={token} messageNumber={message.messageNumber} version={version} />
        <SharedScreenHeader
          token={token}
          trainingTitle={shared.title[locale]}
          messageNumber={message.messageNumber}
          sessions={shared.sessions.map((s) => ({
            number: s.messageNumber,
            label: `${tm("message", { number: s.messageNumber })} · ${berlinDay(
              new Date(s.startsAt),
              locale,
              th("lordsDay"),
            )}`,
          }))}
        />
        <SlideShow
          slides={slides}
          sections={sections}
          footer={t("footer", {
            number: message.messageNumber,
            day: berlinDay(new Date(message.startsAt), locale, th("lordsDay")),
            language: tl(locale),
          })}
        />
      </Stack>
    </Container>
  );
}
