import { requireLocale } from "@/i18n/locale";
import { calendarResponse, trainingCalendar } from "@/lib/calendar";
import { getTrainingById } from "@/lib/data";
import { picksSessions } from "@/lib/domain/types";
import { findByToken } from "@/lib/registrations";

// The messages one registrant signed up for. The edit token in the link is
// the credential, as on the edit page.
export async function GET(
  _req: Request,
  ctx: RouteContext<"/[locale]/training/r/[token]/calendar.ics">,
) {
  const { locale: raw, token } = await ctx.params;
  const locale = requireLocale(raw);
  const reg = await findByToken(token);
  if (!reg || reg.status === "cancelled") return new Response(null, { status: 404 });
  const training = await getTrainingById(reg.training_id);
  const chosen = picksSessions(reg.seat_type)
    ? new Set(reg.registration_sessions.map((s) => s.session_id))
    : undefined;
  return calendarResponse(await trainingCalendar(training, locale, chosen));
}
