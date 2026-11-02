import { languages, type Language } from "./types";

export type OutlineNeed = {
  outline_language: Language;
  second_outline_language: Language | null;
};

export function countOutlines(registrations: OutlineNeed[]): Record<Language, number> {
  const counts = Object.fromEntries(languages.map((l) => [l, 0])) as Record<Language, number>;
  for (const r of registrations) {
    counts[r.outline_language] += 1;
    if (r.second_outline_language) counts[r.second_outline_language] += 1;
  }
  return counts;
}
