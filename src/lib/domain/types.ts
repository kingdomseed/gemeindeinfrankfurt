export type SeatType = "full_time" | "part_time" | "shared" | "anaheim";
export const seatTypes: readonly SeatType[] = ["full_time", "part_time", "shared", "anaheim"];

// Seats whose holder picks the messages: part-time, and Anaheim attendees, who
// may join any message without having to come.
export function picksSessions(seat: SeatType): boolean {
  return seat === "part_time" || seat === "anaheim";
}
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
