import type { Language } from "./types";

// Study groups of 8 to 10 people, as the training asks for.
export const GROUP_MIN = 8;
export const GROUP_MAX = 10;

export function groupSizeOk(size: number) {
  return size >= GROUP_MIN && size <= GROUP_MAX;
}

export type GroupPerson = {
  id: string;
  language: Language;
  locality: string | null;
  siteId?: string | null | undefined;
  siteName?: string | null | undefined;
};

export type SuggestedGroup = {
  language: Language;
  memberIds: string[];
  siteId: string | null;
};

const LANGUAGE_ORDER: readonly Language[] = ["de", "en", "ru"];
const SEPARATE_SITE_LANGUAGE_ORDER: readonly Language[] = ["en", "de", "ru"];

// Remote attendance sites such as Mannheim/Heidelberg always keep their own
// study group rather than mixing with the main venue.
export function isSeparateGroupSite(siteName: string | null | undefined): boolean {
  return Boolean(siteName && /mannheim|heidelberg/i.test(siteName));
}

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

function splitLine(
  memberIds: readonly string[],
  language: Language,
  siteId: string | null,
): SuggestedGroup[] {
  const k = groupCount(memberIds.length);
  const groups: SuggestedGroup[] = [];
  let start = 0;
  for (let i = 0; i < k; i++) {
    const size = Math.floor(memberIds.length / k) + (i < memberIds.length % k ? 1 : 0);
    groups.push({ language, memberIds: memberIds.slice(start, start + size), siteId });
    start += size;
  }
  return groups;
}

function majorityLanguage(people: readonly GroupPerson[]): Language {
  const counts: Record<Language, number> = { de: 0, en: 0, ru: 0 };
  for (const p of people) counts[p.language] += 1;
  let best: Language = "en";
  let bestCount = -1;
  for (const lang of SEPARATE_SITE_LANGUAGE_ORDER) {
    if (counts[lang] > bestCount) {
      best = lang;
      bestCount = counts[lang];
    }
  }
  return best;
}

// Groups by study-group language, then locality, keeping separate attendance
// sites (Mannheim/Heidelberg) in their own groups regardless of language and
// defaulting those to English unless another language is the clear majority.
export function suggestGroups(people: readonly GroupPerson[]): SuggestedGroup[] {
  const general: GroupPerson[] = [];
  const bySite = new Map<
    string,
    { siteId: string | null; siteName: string; members: GroupPerson[] }
  >();

  for (const p of people) {
    if (isSeparateGroupSite(p.siteName)) {
      const key = p.siteId ?? p.siteName ?? "";
      const bucket = bySite.get(key) ?? {
        siteId: p.siteId ?? null,
        siteName: p.siteName ?? "",
        members: [],
      };
      bucket.members.push(p);
      bySite.set(key, bucket);
    } else {
      general.push(p);
    }
  }

  const mainGroups = LANGUAGE_ORDER.flatMap((language) => {
    const speakers = general.filter((p) => p.language === language);
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
    return splitLine(lined, language, null);
  });

  const siteGroups = [...bySite.values()]
    .toSorted((a, b) => a.siteName.localeCompare(b.siteName))
    .flatMap((bucket) =>
      splitLine(
        bucket.members.map((m) => m.id),
        majorityLanguage(bucket.members),
        bucket.siteId,
      ),
    );

  return [...mainGroups, ...siteGroups];
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

// Picks the right group for a newly registered person while keeping separate
// attendance sites (or any site with a dedicated group) isolated from general groups.
export function pickStudyGroup<
  T extends { id: string; language: Language; siteId: string | null; size: number },
>(
  groups: readonly T[],
  person: { language: Language; siteId: string | null; siteName: string | null },
): { group: T | null; createSiteId: string | null } {
  const separate =
    person.siteId !== null &&
    (isSeparateGroupSite(person.siteName) || groups.some((g) => g.siteId === person.siteId));

  if (separate) {
    const matching = groups.filter((g) => g.siteId === person.siteId);
    const sameLanguage = smallestGroup(matching, person.language);
    if (sameLanguage) return { group: sameLanguage, createSiteId: person.siteId };
    let smallest: T | null = null;
    for (const g of matching) {
      if (smallest === null || g.size < smallest.size) smallest = g;
    }
    return { group: smallest, createSiteId: person.siteId };
  }

  return {
    group: smallestGroup(
      groups.filter((g) => g.siteId === null),
      person.language,
    ),
    createSiteId: null,
  };
}
