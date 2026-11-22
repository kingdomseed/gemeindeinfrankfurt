// An iCalendar (RFC 5545) file, so registrants can put their messages, and
// anyone the church's events, into Google Calendar, Apple Calendar or Outlook.

export type CalendarEvent = {
  uid: string;
  title: string;
  startsAt: string; // ISO instant
  endsAt?: string | undefined; // left out when the event has no set end
  location: string;
  description?: string;
  allDay?: boolean; // whole days in Frankfurt, from the start's day through the end's
};

// 20270109T083000Z
function icsTime(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeText(text: string): string {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");
}

const berlinDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 20271226: the Frankfurt date of an instant, moved on by `addDays`.
function icsDate(iso: string, addDays = 0): string {
  const day = new Date(`${berlinDate.format(new Date(iso))}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + addDays);
  return day.toISOString().slice(0, 10).replaceAll("-", "");
}

function eventTimes(e: CalendarEvent): string[] {
  if (e.allDay) {
    // A whole-day event ends on the day after its last day.
    return [
      `DTSTART;VALUE=DATE:${icsDate(e.startsAt)}`,
      `DTEND;VALUE=DATE:${icsDate(e.endsAt ?? e.startsAt, 1)}`,
    ];
  }
  return [`DTSTART:${icsTime(e.startsAt)}`, ...(e.endsAt ? [`DTEND:${icsTime(e.endsAt)}`] : [])];
}

// Lines longer than 75 octets continue on the next line after a space.
function fold(line: string): string {
  const bytes = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildCalendar(name: string, events: readonly CalendarEvent[], now: Date): string {
  const stamp = icsTime(now.toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//gemeindeinfrankfurt.de//Video Training//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      ...eventTimes(e),
      `SUMMARY:${escapeText(e.title)}`,
      ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
      ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
