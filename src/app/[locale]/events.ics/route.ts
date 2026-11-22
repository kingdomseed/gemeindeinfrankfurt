import { getTranslations } from "next-intl/server";

import { requireLocale } from "@/i18n/locale";
import { calendarResponse, eventsCalendar } from "@/lib/calendar";
import { getSiteSettings, getUpcomingEvents } from "@/lib/cms";

// The church's upcoming events, for subscribing in a calendar app.
export async function GET(_req: Request, ctx: RouteContext<"/[locale]/events.ics">) {
  const locale = requireLocale((await ctx.params).locale);
  const [t, settings, events] = await Promise.all([
    getTranslations({ locale, namespace: "site" }),
    getSiteSettings(locale),
    getUpcomingEvents(locale, 200),
  ]);
  const name = settings.siteName ? `${settings.siteName}: ${t("eventsTitle")}` : t("eventsTitle");
  return calendarResponse(eventsCalendar(name, events, settings.meetingAddress), {
    filename: "events.ics",
    cacheControl: "public, max-age=3600",
  });
}
