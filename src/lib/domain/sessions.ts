import type { Session } from "./types";

const timeZone = "Europe/Berlin";

// The church calls Sunday the Lord's Day, so every date the site shows names
// Sunday with the caller's translated `lordsDay` instead of the weekday.
const berlinWeekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" });

function isLordsDay(instant: Date | number): boolean {
  return berlinWeekday.format(instant) === "Sun";
}

// V8's format() turns the narrow no-break space before "AM" into a plain
// space, but formatToParts() keeps it; match format() so labels stay the same.
function joinParts(values: string[]): string {
  return values.join("").replaceAll("\u202f", " ");
}

function formatDay(format: Intl.DateTimeFormat, instant: Date, lordsDay: string): string {
  return joinParts(
    format
      .formatToParts(instant)
      .map((part) => (part.type === "weekday" && isLordsDay(instant) ? lordsDay : part.value)),
  );
}

// Session labels in every language come from the same timestamps.
export function sessionLabel(s: Session, locale: string, messageWord: string, lordsDay: string) {
  const when = formatDay(
    new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    new Date(s.starts_at),
    lordsDay,
  );
  return `${messageWord}: ${when}`;
}

export type ScheduleDay = {
  key: string; // YYYY-MM-DD in Frankfurt
  label: string;
  sessions: { id: string; number: number; time: string }[];
};

const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// The schedule as days in Frankfurt time, each with its messages in order.
export function scheduleDays(sessions: Session[], locale: string, lordsDay: string): ScheduleDay[] {
  const time = new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit" });
  const days = new Map<string, ScheduleDay>();
  for (const s of sessions.toSorted((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))) {
    const at = new Date(s.starts_at);
    const key = dayKey.format(at);
    const day = days.get(key) ?? { key, label: berlinDay(at, locale, lordsDay), sessions: [] };
    day.sessions.push({ id: s.id, number: s.message_number, time: time.format(at) });
    days.set(key, day);
  }
  return [...days.values()];
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
  return joinParts(
    format.formatRangeToParts(first, last).map((part) => {
      if (part.type !== "weekday") return part.value;
      return isLordsDay(part.source === "endRange" ? last : first) ? lordsDay : part.value;
    }),
  );
}
