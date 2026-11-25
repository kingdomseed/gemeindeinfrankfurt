// Coordinators type dates and times as Frankfurt wall-clock time; the
// database stores instants. These convert between the two.

export const BERLIN_TIME_ZONE = "Europe/Berlin" as const;

const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: BERLIN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: BERLIN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const monthKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: BERLIN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// The Frankfurt calendar date ("YYYY-MM-DD") of an instant.
export function berlinDayKey(instant: Date | number): string {
  return dayKeyFormat.format(instant);
}

// The Frankfurt calendar month ("YYYY-MM") of an instant.
export function berlinMonthKey(instant: Date | number): string {
  return monthKeyFormat.format(instant);
}

// Moves a calendar date ("YYYY-MM-DD") by `days` without timezone drift.
export function addCalendarDays(isoDate: string, days: number): string {
  const m = ISO_DATE.exec(isoDate);
  if (!m) throw new RangeError(`Invalid calendar date: ${isoDate}`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    throw new RangeError(`Invalid calendar date: ${isoDate}`);
  }
  d.setUTCDate(day + days);
  return d.toISOString().slice(0, 10);
}

// A calendar date column ("2027-01-09") read at noon UTC so no timezone shifts its day.
export function calendarDayNoon(isoDate: string): Date {
  return new Date(`${addCalendarDays(isoDate, 0)}T12:00:00Z`);
}

// 00:00:00.000 on `isoDate` in Frankfurt.
export function startOfBerlinDate(isoDate: string): Date {
  const start = fromBerlinWallTime({ date: addCalendarDays(isoDate, 0), time: "00:00" });
  if (!start) throw new RangeError(`Invalid Berlin date: ${isoDate}`);
  return start;
}

// 23:59:59.999 on `isoDate` in Frankfurt.
export function endOfBerlinDate(isoDate: string): Date {
  return new Date(startOfBerlinDate(addCalendarDays(isoDate, 1)).getTime() - 1);
}

// 00:00:00.000 on the same calendar day in Frankfurt.
export function startOfBerlinDay(instant: Date): Date {
  return startOfBerlinDate(berlinDayKey(instant));
}

// 23:59:59.999 on the same calendar day in Frankfurt.
export function endOfBerlinDay(instant: Date): Date {
  return endOfBerlinDate(berlinDayKey(instant));
}

export type BerlinWallTime = { date: string; time: string }; // "2027-01-12", "19:00"

// The Frankfurt date and time of an instant, as a date and a time field show them.
export function toBerlinWallTime(instant: Date): BerlinWallTime {
  const p = Object.fromEntries(parts.formatToParts(instant).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

// The wall time read as if it were UTC, in milliseconds. NaN when malformed.
function wallAsUtc({ date, time }: BerlinWallTime): number {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return Number.NaN;
  return Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
}

// How far Frankfurt is ahead of UTC at an instant, in milliseconds.
function offsetAt(ms: number): number {
  return wallAsUtc(toBerlinWallTime(new Date(ms))) - Math.floor(ms / 60_000) * 60_000;
}

// The instant at a Frankfurt date and time. Null for malformed input and for
// times the clock skips when summer time starts.
export function fromBerlinWallTime(wall: BerlinWallTime): Date | null {
  const asUtc = wallAsUtc(wall);
  if (Number.isNaN(asUtc)) return null;
  // Guess with the offset at the wall time read as UTC, then correct once with
  // the offset at the guess, which settles it across a clock change.
  const result = new Date(asUtc - offsetAt(asUtc - offsetAt(asUtc)));
  const back = toBerlinWallTime(result);
  return back.date === wall.date && back.time === wall.time ? result : null;
}
