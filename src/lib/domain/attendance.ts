import { picksSessions, type SeatType } from "./types";

export type Mark = "present" | "absent" | "excused";

// "registrationId:sessionId" for one box of the attendance table.
export function attendanceMarkKey(registrationId: string, sessionId: string): string {
  return `${registrationId}:${sessionId}`;
}

// Whether a seat has to come to a message: full-time and shared seats come to
// all of them, part-timers and Anaheim attendees only to the ones they chose.
export function isRequired(seat: SeatType, chosen: ReadonlySet<string>, sessionId: string) {
  return !picksSessions(seat) || chosen.has(sessionId);
}

// Absences that count, unexcused and excused apart: only for messages the
// seat had to come to.
export function absenceCounts(
  seat: SeatType,
  chosen: ReadonlySet<string>,
  marks: ReadonlyMap<string, Mark>,
) {
  let unexcused = 0;
  let excused = 0;
  for (const [sessionId, mark] of marks) {
    if (!isRequired(seat, chosen, sessionId)) continue;
    if (mark === "absent") unexcused++;
    if (mark === "excused") excused++;
  }
  return { unexcused, excused };
}

// The training allows no unexcused absence and two excused ones at most.
// Over the limit is for the report only; nothing happens to the registrant.
export const MAX_EXCUSED = 2;

export function overLimit(counts: { unexcused: number; excused: number }) {
  return counts.unexcused > 0 || counts.excused > MAX_EXCUSED;
}

export type KeyMatch = { matched: true; mark: Mark | null } | { matched: false };

// What a click on a box in the overview does: empty, present, absent,
// excused, empty. A message someone did not have to come to can only be
// marked present.
export function nextMark(current: Mark | null, required: boolean): Mark | null {
  if (current === null) return "present";
  if (!required) return null;
  if (current === "present") return "absent";
  if (current === "absent") return "excused";
  return null;
}

// Maps a keyboard press on a focused attendance cell to the exact mark (using
// the active language's short keys) or null on Backspace / Delete.
export function markFromKey(
  key: string,
  required: boolean,
  shortKeys: { present: string; absent: string; excused: string },
): KeyMatch {
  if (key === "Backspace" || key === "Delete") return { matched: true, mark: null };
  if (key.length !== 1) return { matched: false };
  const lower = key.toLocaleLowerCase();
  if (lower === shortKeys.present.toLocaleLowerCase()) return { matched: true, mark: "present" };
  if (required) {
    if (lower === shortKeys.absent.toLocaleLowerCase()) return { matched: true, mark: "absent" };
    if (lower === shortKeys.excused.toLocaleLowerCase()) return { matched: true, mark: "excused" };
  }
  return { matched: false };
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
