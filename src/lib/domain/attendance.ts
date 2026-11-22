import { picksSessions, type SeatType } from "./types";

export type Mark = "present" | "absent";

// Whether a seat has to come to a message: full-time and shared seats come to
// all of them, part-timers and Anaheim attendees only to the ones they chose.
export function isRequired(seat: SeatType, chosen: ReadonlySet<string>, sessionId: string) {
  return !picksSessions(seat) || chosen.has(sessionId);
}

// Absences that count: only for messages the seat had to come to.
export function absenceCount(
  seat: SeatType,
  chosen: ReadonlySet<string>,
  marks: ReadonlyMap<string, Mark>,
) {
  let count = 0;
  for (const [sessionId, mark] of marks) {
    if (mark === "absent" && isRequired(seat, chosen, sessionId)) count++;
  }
  return count;
}

// The training allows two absences at most.
export const MAX_ABSENCES = 2;

// What a click on a box in the overview does: empty, present, absent, empty.
// A message someone did not have to come to can only be marked present.
export function nextMark(current: Mark | null, required: boolean): Mark | null {
  if (current === null) return "present";
  if (current === "present" && required) return "absent";
  return null;
}

// The message to take attendance for: the first one that has not ended yet,
// or the last one once the training is over.
export function currentSession<T extends { starts_at: string; ends_at: string }>(
  sessions: readonly T[],
  now: Date,
): T | null {
  const ordered = sessions.toSorted((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  return ordered.find((s) => Date.parse(s.ends_at) > now.getTime()) ?? ordered.at(-1) ?? null;
}
