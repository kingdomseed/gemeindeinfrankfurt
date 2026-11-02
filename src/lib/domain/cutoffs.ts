import type { Session } from "./types";

export type Cutoffs = {
  // Seat type, chosen sessions and cancelling lock when the first session starts.
  seatAndSessionsLockAt: Date;
  // New registrations close at the end of the first local day (Europe/Berlin).
  registrationClosesAt: Date;
};

export function firstSession(sessions: Session[]): Session | undefined {
  return [...sessions].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  )[0];
}

export function computeCutoffs(sessions: Session[]): Cutoffs | null {
  const first = firstSession(sessions);
  if (!first) return null;
  const start = new Date(first.starts_at);
  return {
    seatAndSessionsLockAt: start,
    registrationClosesAt: endOfBerlinDay(start),
  };
}

export function canRegister(sessions: Session[], now = new Date()): boolean {
  const c = computeCutoffs(sessions);
  return c !== null && now < c.registrationClosesAt;
}

export function canChangeSeatOrSessions(sessions: Session[], now = new Date()): boolean {
  const c = computeCutoffs(sessions);
  return c !== null && now < c.seatAndSessionsLockAt;
}

export const canCancel = canChangeSeatOrSessions;

// 23:59:59.999 on the same calendar day in Berlin, as an absolute instant.
export function endOfBerlinDay(instant: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant); // YYYY-MM-DD
  const nextMidnightUtc = Date.parse(`${parts}T00:00:00Z`) + 24 * 3600_000;
  const offsetMs = berlinOffsetMs(new Date(nextMidnightUtc));
  return new Date(nextMidnightUtc - offsetMs - 1);
}

function berlinOffsetMs(at: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    timeZoneName: "shortOffset",
  })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")!.value; // e.g. "GMT+1"
  const m = /GMT([+-]\d+)?(?::(\d+))?/.exec(name);
  const hours = m?.[1] ? Number(m[1]) : 0;
  const minutes = m?.[2] ? Number(m[2]) : 0;
  return (hours * 60 + Math.sign(hours) * minutes) * 60_000;
}
