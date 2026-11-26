import { Flex, Link, Stack } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CopyButton } from "@/components/ui/copy-button";
import { messageHref } from "@/features/coordinator/sections";
import { buildMessageSlides } from "@/features/coordinator/slides";
import { SlideShow } from "@/features/coordinator/SlideShow";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink } from "@/i18n/navigation";
import { berlinDay } from "@/lib/domain/sessions";
import { loadMessages } from "@/lib/messages";
import { siteUrl } from "@/lib/site";

import { requireActiveWorkspace } from "../../../workspace";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/messages/[number]/screen">;

const messageNumber = z.coerce.number().int().positive();

export async function generateMetadata({ params }: Props) {
  const { locale: raw, number } = await params;
  const t = await getTranslations({ locale: requireLocale(raw), namespace: "coordinator.screen" });
  return { title: t("titleFor", { number: messageNumber.catch(0).parse(number) }) };
}

// The slides for one message on the room's screen: rules and hymns in `locale`,
// and all three languages (DE / EN / RU) together on every verse slide.
export default async function ScreenPage({ params }: Props) {
  const { locale: raw, number: rawNumber } = await params;
  const ws = await requireActiveWorkspace(raw);
  const number = messageNumber.safeParse(rawNumber);
  if (!number.success) notFound();
  if (!ws.ok) return ws.fallback;
  const { locale, data, supabase } = ws.workspace;
  const [t, tm, tr, th, tl, messages] = await Promise.all([
    getTranslations("coordinator.screen"),
    getTranslations("coordinator.messages"),
    getTranslations("register"),
    getTranslations("home"),
    getTranslations("common.languages"),
    loadMessages(supabase, data.training.id),
  ]);
  const message = messages.find((m) => m.messageNumber === number.data);
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

  const shareUrl = `${siteUrl()}/${locale}/training/screen/${data.training.screen_token}/${message.messageNumber}`;

  return (
    <Stack gap="4">
      <Flex justify="space-between" align="center" gap="3" wrap="wrap">
        <Link asChild fontSize="sm" color="fg" textDecoration="underline">
          <LocaleLink href={messageHref(message.messageNumber)}>
            {t("back", { number: message.messageNumber })}
          </LocaleLink>
        </Link>
        <CopyButton
          value={shareUrl}
          label={tm("copyShareLink")}
          copiedLabel={tm("shareLinkCopied")}
        />
      </Flex>
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
  );
}
