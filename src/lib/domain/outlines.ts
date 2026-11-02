import type { Language } from "./types";

export type OutlineNeed = {
  outline_language: Language;
  second_outline_language: Language | null;
};

export function countOutlines(registrations: OutlineNeed[]): Record<Language, number> {
  const counts: Record<Language, number> = { de: 0, en: 0, ru: 0 };
  for (const r of registrations) {
    counts[r.outline_language] += 1;
    if (r.second_outline_language) counts[r.second_outline_language] += 1;
  }
  return counts;
}
