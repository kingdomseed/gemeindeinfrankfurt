export type SeatType = "full_time" | "part_time" | "shared";
export const seatTypes: readonly SeatType[] = ["full_time", "part_time", "shared"];
export type Language = "de" | "en" | "ru";
export const languages: readonly Language[] = ["de", "en", "ru"];

export function isLanguage(value: unknown): value is Language {
  return languages.some((l) => l === value);
}

export type Session = {
  id: string;
  message_number: number;
  starts_at: string;
  ends_at: string;
};
