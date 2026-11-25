import { endOfBerlinDay } from "./berlin-time";
import type { Session } from "./types";

export { endOfBerlinDay };

export type Cutoffs = {
  // Seat type, chosen sessions and cancelling lock when the first session starts.
  seatAndSessionsLockAt: Date;
  // New registrations close at the end of the first local day (Europe/Berlin).
  registrationClosesAt: Date;
};

export function firstSession(sessions: Session[]): Session | undefined {
  return sessions.toSorted((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0];
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
