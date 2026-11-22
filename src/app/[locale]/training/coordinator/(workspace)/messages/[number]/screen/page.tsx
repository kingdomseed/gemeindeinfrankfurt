import { Link, Stack } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PageMessage } from "@/components/ui/page-message";
import { messageHref } from "@/features/coordinator/sections";
import { SlideShow, type Slide } from "@/features/coordinator/SlideShow";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink, redirect } from "@/i18n/navigation";
import { loadCoordination } from "@/lib/coordinator";
import { hymnNumber } from "@/lib/domain/messages";
import { berlinDay } from "@/lib/domain/sessions";
import { languages } from "@/lib/domain/types";
import { loadMessages } from "@/lib/messages";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/messages/[number]/screen">;

const messageNumber = z.coerce.number().int().positive();

// The training rules as the registration form words them, word for word.
const ruleKeys = [
  "attendRules.seat",
  "attendRules.nameTag",
  "attendRules.absences",
  "attendRules.testing",
  "attendRules.leaving",
  "materialsRule",
  "copiesRule",
] as const;

export async function generateMetadata({ params }: Props) {
  const { locale: raw, number } = await params;
  const t = await getTranslations({ locale: requireLocale(raw), namespace: "coordinator.screen" });
  return { title: t("titleFor", { number: messageNumber.catch(0).parse(number) }) };
}

// The slides for one message on the room's screen, in the page's language:
// the training rules, then the hymns, then the verses.
export default async function ScreenPage({ params }: Props) {
  const { locale: raw, number: rawNumber } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const number = messageNumber.safeParse(rawNumber);
  if (!number.success) notFound();
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, tm, tr, th, tl] = await Promise.all([
    getTranslations("coordinator.screen"),
    getTranslations("coordinator.messages"),
    getTranslations("register"),
    getTranslations("home"),
    getTranslations("common.languages"),
  ]);
  const { data, supabase } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const messages = await loadMessages(supabase, data.training.id);
  const message = messages.find((m) => m.messageNumber === number.data);
  if (!message) notFound();

  const rules = ruleKeys.map((key, i): Slide => ({
    meta: t("ruleMeta", { number: i + 1, total: ruleKeys.length }),
    title: tr(key),
    body: "",
    lang: locale,
  }));
  const hymns = message.hymns.map((h, i): Slide => {
    const own = hymnNumber(h, locale);
    return {
      meta: t("hymnMeta", { number: i + 1, total: message.hymns.length }),
      title: own ? t("hymn", { number: own }) : t("hymnIn", { number: h.en, language: tl("en") }),
      body: languages
        .filter((l) => l !== locale && (own || l !== "en"))
        .map((l) => `${tl(l)} ${hymnNumber(h, l) ?? tm("notIn", { language: tl(l) })}`)
        .join("\n"),
      lang: locale,
    };
  });
  const verses = message.verses.map((v, i): Slide => ({
    meta: t("verseMeta", { number: i + 1, total: message.verses.length }),
    title: v.ref,
    body: v.text[locale]?.trim() || t("verseMissing", { language: tl(locale) }),
    lang: locale,
  }));

  return (
    <Stack gap="4">
      <Link asChild fontSize="sm" color="fg" textDecoration="underline" alignSelf="flex-start">
        <LocaleLink href={messageHref(message.messageNumber)}>
          {t("back", { number: message.messageNumber })}
        </LocaleLink>
      </Link>
      <SlideShow
        slides={[...rules, ...hymns, ...verses]}
        footer={t("footer", {
          number: message.messageNumber,
          day: berlinDay(new Date(message.startsAt), locale, th("lordsDay")),
          language: tl(locale),
        })}
      />
    </Stack>
  );
}
