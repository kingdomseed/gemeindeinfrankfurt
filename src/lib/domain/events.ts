import { endOfBerlinDay } from "./cutoffs";
import { berlinDay, berlinDayTime } from "./sessions";

// The start of today in Frankfurt. An event stays in the list of upcoming
// events until the end of the day it ends on (or starts on, without an end),
// so the Lord's Day meeting still shows on the Lord's Day afternoon.
export function startOfBerlinToday(now: Date): Date {
  return new Date(endOfBerlinDay(new Date(now.getTime() - 24 * 3600_000)).getTime() + 1);
}

const berlinDayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// When an event takes place, in the reader's language and Frankfurt time:
// "Saturday 9 January, 09:30", "Saturday 9 January, 09:30–12:00", or
// "Friday 26 – Lord's Day 28 December" for an event over several days.
export function eventWhen(
  startsAt: Date,
  endsAt: Date | null,
  locale: string,
  lordsDay: string,
): string {
  if (!endsAt || endsAt <= startsAt) return berlinDayTime(startsAt, locale, lordsDay);
  if (berlinDayKey.format(startsAt) === berlinDayKey.format(endsAt)) {
    const time = new Intl.DateTimeFormat(locale, {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${berlinDayTime(startsAt, locale, lordsDay)}–${time.format(endsAt)}`;
  }
  return `${berlinDay(startsAt, locale, lordsDay)} – ${berlinDay(endsAt, locale, lordsDay)}`;
}
