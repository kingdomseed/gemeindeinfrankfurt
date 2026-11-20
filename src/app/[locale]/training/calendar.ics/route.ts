import { requireLocale } from "@/i18n/locale";
import { calendarResponse, trainingCalendar } from "@/lib/calendar";
import { getPublishedTraining } from "@/lib/data";

// Every message of the published training, for adding before registering.
export async function GET(_req: Request, ctx: RouteContext<"/[locale]/training/calendar.ics">) {
  const locale = requireLocale((await ctx.params).locale);
  const training = await getPublishedTraining();
  if (!training) return new Response(null, { status: 404 });
  return calendarResponse(await trainingCalendar(training, locale));
}
