export type SeatType = "full_time" | "part_time" | "shared";
export type Language = "de" | "en" | "ru";
export const languages: Language[] = ["de", "en", "ru"];

export type Session = {
  id: string;
  message_number: number;
  starts_at: string;
  ends_at: string;
};
