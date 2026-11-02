import type { Language, SeatType } from "@/lib/domain/types";

export type SessionOption = { id: string; label: string };

export type PaymentDetails = { payee: string; iban: string; reference: string };

export type PersonDefaults = {
  first_name: string;
  last_name: string;
  partner_first_name: string;
  partner_last_name: string;
  email: string;
  phone: string;
};

// A stored registration, used to fill the form on the edit page.
export type RegistrationDefaults = PersonDefaults & {
  seat_type: SeatType;
  session_ids: string[];
  group_language: Language;
  outline_language: Language;
  second_outline_language: Language | null;
  comments: string;
  payer_name: string;
  attended_anaheim: boolean;
  ukraine_not_employed: boolean;
};

// What a registration server action answers; the form maps status to text.
export type ActionState = { status: string };
