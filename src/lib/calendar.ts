import "server-only";
import { getTranslations } from "next-intl/server";

import type { TrainingWithSessions } from "@/lib/data";
import { buildCalendar } from "@/lib/domain/ics";
import type { Language } from "@/lib/domain/types";

// Where a calendar file is served: the whole schedule, or one registrant's
// messages behind their edit token.
export function calendarUrl(locale: Language, token?: string): string {
  const base = `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/training`;
  return token ? `${base}/r/${token}/calendar.ics` : `${base}/calendar.ics`;
}

// The training's messages as an .ics file. With `sessionIds`, only those.
export async function trainingCalendar(
  training: TrainingWithSessions,
  locale: Language,
  sessionIds?: ReadonlySet<string>,
): Promise<string> {
  const t = await getTranslations({ locale, namespace: "home" });
  const title = training.title[locale];
  const sessions = training.sessions
    .filter((s) => !sessionIds || sessionIds.has(s.id))
    .toSorted((a, b) => a.message_number - b.message_number);
  return buildCalendar(
    title,
    sessions.map((s) => ({
      uid: `${s.id}@gemeindeinfrankfurt.de`,
      title: `${title}: ${t("message", { number: s.message_number })}`,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      location: training.venue,
    })),
    new Date(),
  );
}

export function calendarResponse(ics: string): Response {
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="video-training.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
