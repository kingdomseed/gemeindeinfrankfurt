import type { Language } from "./types";

export type Hymn = { en: string; de: string | null; ru: string | null };
export type Verse = { ref: string; text: { [L in Language]?: string | undefined } };

export type Readiness =
  | { status: "empty" }
  | { status: "ready" }
  | { status: "missing"; count: number };

// Whether a message is ready for the screen: it has hymns or verses, and
// every verse has its text in all three languages. Each missing text counts.
export function messageReadiness(hymns: readonly Hymn[], verses: readonly Verse[]): Readiness {
  if (hymns.length === 0 && verses.length === 0) return { status: "empty" };
  const missing = verses.reduce(
    (n, v) => n + (["de", "en", "ru"] as const).filter((l) => !v.text[l]?.trim()).length,
    0,
  );
  if (hymns.length === 0) return { status: "missing", count: missing + 1 };
  return missing === 0 ? { status: "ready" } : { status: "missing", count: missing };
}

// A hymn's number in a language, or null when the hymn does not exist there.
// Every hymn exists in English.
export function hymnNumber(hymn: Hymn, language: Language): string | null {
  return language === "en" ? hymn.en : hymn[language];
}

// Stable keys for a list that may repeat a value: "501", "501#2", ...
export function occurrenceKeys(values: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return values.map((v) => {
    const n = (seen.get(v) ?? 0) + 1;
    seen.set(v, n);
    return n === 1 ? v : `${v}#${n}`;
  });
}
