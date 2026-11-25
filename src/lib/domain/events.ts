import { BERLIN_TIME_ZONE, berlinDayKey, startOfBerlinDay } from "./berlin-time";
import { berlinDay, berlinDayTime } from "./sessions";

// The start of today in Frankfurt. An event stays in the list of upcoming
// events until the end of the day it ends on (or starts on, without an end),
// so the Lord's Day meeting still shows on the Lord's Day afternoon.
export function startOfBerlinToday(now: Date): Date {
  return startOfBerlinDay(now);
}

// When an event takes place, in the reader's language and Frankfurt time:
// "Saturday 9 January, 09:30", "Saturday 9 January, 09:30–12:00", or
// "Friday 26 – Lord's Day 28 December" for an event over several days.
// A whole-day event shows its days without times.
export function eventWhen(
  event: { startsAt: Date; endsAt: Date | null; allDay: boolean },
  locale: string,
  lordsDay: string,
): string {
  const { startsAt, endsAt, allDay } = event;
  const oneDay = !endsAt || berlinDayKey(startsAt) === berlinDayKey(endsAt);
  if (allDay && oneDay) return berlinDay(startsAt, locale, lordsDay);
  if (!endsAt || endsAt <= startsAt) return berlinDayTime(startsAt, locale, lordsDay);
  if (!allDay && oneDay) {
    const time = new Intl.DateTimeFormat(locale, {
      timeZone: BERLIN_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${berlinDayTime(startsAt, locale, lordsDay)}–${time.format(endsAt)}`;
  }
  return `${berlinDay(startsAt, locale, lordsDay)} – ${berlinDay(endsAt, locale, lordsDay)}`;
}
