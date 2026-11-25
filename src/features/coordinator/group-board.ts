import type { CoordinatorRegistration } from "@/lib/coordinator";
import { displayLocality } from "@/lib/domain/locality";
import type { Language } from "@/lib/domain/types";
import type { StudyGroup } from "@/lib/groups";

import { displayName } from "./display";

export type GroupMember = {
  id: string;
  name: string;
  // Both names on a shared seat, for name tags.
  names: string[];
  seat: CoordinatorRegistration["seat_type"];
  language: Language;
  locality: string | null;
  site: string | null;
};

export type BoardGroup = {
  id: string;
  number: number;
  language: Language;
  // Cities and attendance sites of its members, most members first.
  localities: string[];
  sites: string[];
  members: GroupMember[];
};

function member(r: CoordinatorRegistration): GroupMember {
  return {
    id: r.id,
    name: displayName(r),
    names:
      r.seat_type === "shared"
        ? [`${r.first_name} ${r.last_name}`, `${r.partner_first_name} ${r.partner_last_name}`]
        : [`${r.first_name} ${r.last_name}`],
    seat: r.seat_type,
    language: r.group_language,
    locality: displayLocality(r),
    site: r.training_sites?.name ?? null,
  };
}

function valuesByCount(members: readonly GroupMember[], pick: (m: GroupMember) => string | null) {
  const count = new Map<string, number>();
  for (const m of members) {
    const v = pick(m);
    if (v) count.set(v, (count.get(v) ?? 0) + 1);
  }
  return [...count.entries()]
    .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value]) => value);
}

// The study groups with their active members, and the active people in no
// group yet. Cancelled registrations drop out of their group.
export function groupBoard(
  registrations: readonly CoordinatorRegistration[],
  groups: readonly StudyGroup[],
) {
  const active = new Map(
    registrations.filter((r) => r.status === "active").map((r) => [r.id, member(r)]),
  );
  const placed = new Set<string>();
  const board: BoardGroup[] = groups.map((g) => {
    const members = g.memberIds.flatMap((id) => {
      const m = active.get(id);
      if (!m) return [];
      placed.add(id);
      return [m];
    });
    return {
      id: g.id,
      number: g.number,
      language: g.language,
      localities: valuesByCount(members, (m) => m.locality),
      sites: valuesByCount(members, (m) => m.site),
      members,
    };
  });
  return {
    groups: board,
    unassigned: [...active.values()].filter((m) => !placed.has(m.id)),
    people: active.size,
  };
}

export type GroupBoard = ReturnType<typeof groupBoard>;
