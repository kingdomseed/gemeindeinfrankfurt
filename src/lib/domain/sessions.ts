import { BERLIN_TIME_ZONE as timeZone, berlinDayKey } from "./berlin-time";
import type { Session } from "./types";

// The church calls Sunday the Lord's Day, so every date the site shows names
// Sunday with the caller's translated `lordsDay` instead of the weekday.
const berlinWeekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" });

const isoWeekdayOrder: Readonly<Record<string, number>> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

function berlinWeekdayNumber(instant: Date | number): number {
  return isoWeekdayOrder[berlinWeekday.format(instant)] ?? 7;
}

function isLordsDay(instant: Date | number): boolean {
  return berlinWeekday.format(instant) === "Sun";
}

// Mon–Fri on the Frankfurt calendar default to online sessions; Sat and Lord's Day default to in person.
export function isBerlinWeekday(instant: Date | number): boolean {
  const day = berlinWeekdayNumber(instant);
  return day >= 1 && day <= 5;
}

// V8's format() turns the narrow no-break space before "AM" into a plain
// space, and formatRangeToParts() may emit thin spaces (\u2009); normalize both.
function joinParts(values: string[]): string {
  return values.join("").replaceAll(/[\u2009\u202f]/g, " ");
}

function validEnd(startsAt: string, endsAt: string): Date | null {
  if (!endsAt) return null;
  const startMs = Date.parse(startsAt);
  const endMs = Date.parse(endsAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null;
  return new Date(endMs);
}

function formatDay(format: Intl.DateTimeFormat, instant: Date, lordsDay: string): string {
  return joinParts(
    format
      .formatToParts(instant)
      .map((part) => (part.type === "weekday" && isLordsDay(instant) ? lordsDay : part.value)),
  );
}

function formatDayRange(
  format: Intl.DateTimeFormat,
  start: Date | number,
  end: Date | number,
  lordsDay: string,
): string {
  return joinParts(
    format.formatRangeToParts(start, end).map((part) => {
      if (part.type !== "weekday") return part.value;
      return isLordsDay(part.source === "endRange" ? end : start) ? lordsDay : part.value;
    }),
  );
}

// Session labels in every language come from the same timestamps.
export function sessionLabel(s: Session, locale: string, messageWord: string, lordsDay: string) {
  const format = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const start = new Date(s.starts_at);
  const end = validEnd(s.starts_at, s.ends_at);
  const when = end
    ? formatDayRange(format, start, end, lordsDay)
    : formatDay(format, start, lordsDay);
  return `${messageWord}: ${when}`;
}

export type ScheduleDay = {
  key: string; // YYYY-MM-DD in Frankfurt
  label: string;
  sessions: { id: string; number: number; time: string; isOnline?: boolean | undefined }[];
};

// The schedule as days in Frankfurt time, each with its messages in order.
export function scheduleDays(
  sessions: readonly (Session & { is_online?: boolean | undefined })[],
  locale: string,
  lordsDay: string,
): ScheduleDay[] {
  const time = new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit" });
  const days = new Map<string, ScheduleDay>();
  for (const s of sessions.toSorted((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))) {
    const at = new Date(s.starts_at);
    const end = validEnd(s.starts_at, s.ends_at);
    const key = berlinDayKey(at);
    const day = days.get(key) ?? { key, label: berlinDay(at, locale, lordsDay), sessions: [] };
    day.sessions.push({
      id: s.id,
      number: s.message_number,
      time: end
        ? joinParts(time.formatRangeToParts(at, end).map((part) => part.value))
        : time.format(at),
      ...(s.is_online !== undefined ? { isOnline: s.is_online } : {}),
    });
    days.set(key, day);
  }
  return [...days.values()];
}

function orderedWeekdayNames(map: Map<number, string>): string[] {
  return [...map.entries()].toSorted(([a], [b]) => a - b).map(([, name]) => name);
}

// Distinct weekdays (Mon–Sun order) for online vs. in-person sessions, using the
// reader's language and `lordsDay` for Sunday.
export function sessionFormatDays(
  sessions: readonly { starts_at: string; is_online: boolean }[],
  locale: string,
  lordsDay: string,
): { onlineDays: string[]; inPersonDays: string[] } {
  const online = new Map<number, string>();
  const inPerson = new Map<number, string>();
  const weekdayName = new Intl.DateTimeFormat(locale, { timeZone, weekday: "long" });
  for (const s of sessions) {
    const at = new Date(s.starts_at);
    const num = berlinWeekdayNumber(at);
    const target = s.is_online ? online : inPerson;
    if (!target.has(num)) {
      target.set(num, num === 7 ? lordsDay : weekdayName.format(at));
    }
  }
  return {
    onlineDays: orderedWeekdayNames(online),
    inPersonDays: orderedWeekdayNames(inPerson),
  };
}

// "Saturday 9 January" in the reader's language, on the Frankfurt calendar.
export function berlinDay(instant: Date, locale: string, lordsDay: string): string {
  return formatDay(
    new Intl.DateTimeFormat(locale, { timeZone, weekday: "long", day: "numeric", month: "long" }),
    instant,
    lordsDay,
  );
}

// "Saturday 9 January, 09:30" in the reader's language, in Frankfurt time.
export function berlinDayTime(instant: Date, locale: string, lordsDay: string): string {
  return formatDay(
    new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }),
    instant,
    lordsDay,
  );
}

// "Saturday 9 – Sunday 17 January 2027": first to last message day, in the
// reader's language on the Frankfurt calendar. Null when there are no sessions.
export function trainingDates(
  sessions: Session[],
  locale: string,
  lordsDay: string,
): string | null {
  const starts = sessions.map((s) => Date.parse(s.starts_at));
  if (starts.length === 0) return null;
  const first = Math.min(...starts);
  const last = Math.max(...starts);
  const format = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatDayRange(format, first, last, lordsDay);
}

// "12–24 January 2027": the same span without weekdays, for tight spaces such
// as the registration banner. Null when there are no sessions.
export function trainingDateSpan(sessions: Session[], locale: string): string | null {
  const starts = sessions.map((s) => Date.parse(s.starts_at));
  if (starts.length === 0) return null;
  const format = new Intl.DateTimeFormat(locale, {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return joinParts(
    format.formatRangeToParts(Math.min(...starts), Math.max(...starts)).map((p) => p.value),
  );
}

// "12 January" on the Frankfurt calendar, without the weekday, so it reads
// right after a preposition in every language ("до 12 января").
export function berlinDate(instant: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, day: "numeric", month: "long" }).format(
    instant,
  );
}
