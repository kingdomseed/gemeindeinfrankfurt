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
  locality_id: string | null;
  other_locality: string;
  site_id: string | null;
  group_language: Language;
  outline_language: Language | null;
  second_outline_language: Language | null;
  comments: string;
};

// What the register and edit actions answer; the form maps status to text.
// Only a new registration ends in "done", with the link to its own calendar.
export type ActionState =
  | { status: "idle" | "error" | "duplicate" | "closed" | "saved" }
  | { status: "done"; calendarUrl: string };

export type ActionStatus = ActionState["status"];

// What cancelling a registration answers.
export type CancelState = { status: "idle" | "error" | "cancelled" | "locked" };

// What the receipt repeats back after a successful submit, taken from the form
// as it was sent. `chosenSessions` is null for seats that attend every message.
export type SubmittedSummary = {
  name: string;
  email: string;
  locality: string | null;
  site: string | null;
  seatType: SeatType;
  chosenSessions: number | null;
  groupLanguage: Language;
  outlineLanguage: Language | null;
  secondOutlineLanguage: Language | null;
};
