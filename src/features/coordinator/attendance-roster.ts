import type { CoordinatorRegistration } from "@/lib/coordinator";

import type { GroupBoard } from "./group-board";

export type RosterPerson = {
  id: string;
  name: string;
  seat: CoordinatorRegistration["seat_type"];
  groupNumber: number | null;
  // Sessions a part-timer or Anaheim attendee chose.
  chosen: string[];
};

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

// Everyone taking part, in group order and by name within a group; people in
// no group come last.
export function attendanceRoster(
  registrations: readonly CoordinatorRegistration[],
  board: GroupBoard,
): RosterPerson[] {
  const chosen = new Map(
    registrations.map((r) => [r.id, r.registration_sessions.map((s) => s.session_id)]),
  );
  const person = (m: GroupBoard["unassigned"][number], groupNumber: number | null) => ({
    id: m.id,
    name: m.name,
    seat: m.seat,
    groupNumber,
    chosen: chosen.get(m.id) ?? [],
  });
  return [
    ...board.groups.flatMap((g) => g.members.toSorted(byName).map((m) => person(m, g.number))),
    ...board.unassigned.toSorted(byName).map((m) => person(m, null)),
  ];
}
