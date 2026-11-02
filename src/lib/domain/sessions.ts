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
