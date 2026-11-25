// Coordinators type dates and times as Frankfurt wall-clock time; the
// database stores instants. These convert between the two.

const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

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
