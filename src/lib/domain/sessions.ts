import type { Session } from "./types";

// Session labels in every language come from the same timestamps.
export function sessionLabel(s: Session, locale: string, messageWord: string) {
  const when = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Berlin",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s.starts_at));
  return `${messageWord}: ${when}`;
}

const timeZone = "Europe/Berlin";

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
export function scheduleDays(sessions: Session[], locale: string): ScheduleDay[] {
  const time = new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit" });
  const days = new Map<string, ScheduleDay>();
  for (const s of sessions.toSorted((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))) {
    const at = new Date(s.starts_at);
    const key = dayKey.format(at);
    const day = days.get(key) ?? { key, label: berlinDay(at, locale), sessions: [] };
    day.sessions.push({ id: s.id, number: s.message_number, time: time.format(at) });
    days.set(key, day);
  }
  return [...days.values()];
}

// "Saturday 9 January" in the reader's language, on the Frankfurt calendar.
export function berlinDay(instant: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(instant);
}

// "Saturday 9 January, 09:30" in the reader's language, in Frankfurt time.
export function berlinDayTime(instant: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(instant);
}
