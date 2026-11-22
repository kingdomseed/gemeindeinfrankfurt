import { languages, type Language, type SeatType } from "./types";

// Who a coordinator's email goes to: everyone registered, everyone who still
// owes money, the part-time seats, or one study group (by its id).
export type Audience = "everyone" | "unpaid" | "part_time" | `group:${string}`;

export function isAudience(value: string): value is Audience {
  return (
    value === "everyone" ||
    value === "unpaid" ||
    value === "part_time" ||
    /^group:[0-9a-f-]{36}$/.test(value)
  );
}

export type AudienceMember = {
  locale: Language;
  seat: SeatType;
  openCents: number;
  groupId: string | null;
};

export function inAudience(member: AudienceMember, audience: Audience): boolean {
  if (audience === "everyone") return true;
  if (audience === "unpaid") return member.openCents > 0;
  if (audience === "part_time") return member.seat === "part_time";
  return member.groupId === audience.slice("group:".length);
}

// How many people in a group of recipients read each language.
export function countByLocale(members: readonly { locale: Language }[]): Record<Language, number> {
  const counts: Record<Language, number> = { de: 0, en: 0, ru: 0 };
  for (const m of members) counts[m.locale] += 1;
  return counts;
}

export type EmailText = { subject: string; body: string };
export type EmailTexts = { [L in Language]?: EmailText | undefined };

// The text a reader gets: their own language, or English when that is missing.
export function textFor(texts: EmailTexts, locale: Language): EmailText | null {
  return texts[locale] ?? texts.en ?? null;
}

// The languages with readers but no text of their own, who would get English.
export function fallbackLanguages(
  counts: Record<Language, number>,
  written: ReadonlySet<Language>,
): Language[] {
  return languages.filter((l) => l !== "en" && counts[l] > 0 && !written.has(l));
}

// The "Before the training" email is due this many days before the first message.
export const BEFORE_TRAINING_DAYS = 3;

export function beforeTrainingDue(firstStart: Date): Date {
  return new Date(firstStart.getTime() - BEFORE_TRAINING_DAYS * 24 * 60 * 60 * 1000);
}
