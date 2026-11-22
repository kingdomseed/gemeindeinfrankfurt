import type { Language } from "./types";

// Study groups of 8 to 10 people, as the training asks for.
export const GROUP_MIN = 8;
export const GROUP_MAX = 10;

export function groupSizeOk(size: number) {
  return size >= GROUP_MIN && size <= GROUP_MAX;
}

export type GroupPerson = { id: string; language: Language; locality: string | null };
export type SuggestedGroup = { language: Language; memberIds: string[] };

const LANGUAGE_ORDER: readonly Language[] = ["de", "en", "ru"];

// How far a group of this size is from 8–10.
function outOfRange(size: number) {
  if (size < GROUP_MIN) return GROUP_MIN - size;
  if (size > GROUP_MAX) return size - GROUP_MAX;
  return 0;
}

// The number of groups for n people: the one whose evenly split groups come
// closest to 8–10, and the fewest groups when two come equally close.
export function groupCount(n: number) {
  if (n === 0) return 0;
  let best = 1;
  let bestMiss = Number.POSITIVE_INFINITY;
  for (let k = 1; k <= Math.ceil(n / GROUP_MIN) + 1; k++) {
    const small = Math.floor(n / k);
    const large = Math.ceil(n / k);
    const bigOnes = n % k;
    const miss = bigOnes * outOfRange(large) + (k - bigOnes) * outOfRange(small);
    if (miss < bestMiss) {
      best = k;
      bestMiss = miss;
    }
  }
  return best;
}

// Groups by study-group language, then locality: people from the same city
// sit next to each other (the largest city first) and the line is cut into
// evenly sized groups. People keep the order they came in within a city.
export function suggestGroups(people: readonly GroupPerson[]): SuggestedGroup[] {
  return LANGUAGE_ORDER.flatMap((language) => {
    const speakers = people.filter((p) => p.language === language);
    const cityCount = new Map<string, number>();
    for (const p of speakers) {
      const city = p.locality ?? "";
      cityCount.set(city, (cityCount.get(city) ?? 0) + 1);
    }
    const lined = speakers
      .map((p, index) => ({ p, index, city: p.locality ?? "" }))
      .toSorted(
        (a, b) =>
          (cityCount.get(b.city) ?? 0) - (cityCount.get(a.city) ?? 0) ||
          a.city.localeCompare(b.city) ||
          a.index - b.index,
      )
      .map((x) => x.p.id);
    const k = groupCount(lined.length);
    const groups: SuggestedGroup[] = [];
    let start = 0;
    for (let i = 0; i < k; i++) {
      const size = Math.floor(lined.length / k) + (i < lined.length % k ? 1 : 0);
      groups.push({ language, memberIds: lined.slice(start, start + size) });
      start += size;
    }
    return groups;
  });
}

// Where someone who registers after the groups were made goes: the smallest
// group in their language, the first one when two are equally small.
export function smallestGroup<T extends { language: Language; size: number }>(
  groups: readonly T[],
  language: Language,
): T | null {
  let best: T | null = null;
  for (const g of groups) {
    if (g.language === language && (best === null || g.size < best.size)) best = g;
  }
  return best;
}
