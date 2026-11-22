import type { TrainingWithSessions } from "@/lib/data";
import { sessionLabel } from "@/lib/domain/sessions";
import type { Language } from "@/lib/domain/types";

import type { PaymentDetails, RegistrationDefaults, SessionOption } from "./types";

// The training data the registration form needs, shaped for its props. Used by
// both the register and the edit route.
export function trainingFormProps(
  training: TrainingWithSessions,
  locale: Language,
  messageWord: (number: number) => string,
  lordsDay: string,
): {
  sessions: SessionOption[];
  prices: { feeCents: number; outlinePriceCents: number };
  payment: PaymentDetails;
} {
  return {
    sessions: training.sessions.map((s) => ({
      id: s.id,
      label: sessionLabel(s, locale, messageWord(s.message_number), lordsDay),
    })),
    prices: { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents },
    payment: {
      payee: training.payee_name,
      iban: training.payee_iban,
      reference: training.payment_reference,
    },
  };
}

// A stored registration as both the edit and the coordinator route load it.
type StoredRegistration = Omit<
  RegistrationDefaults,
  "session_ids" | "partner_first_name" | "partner_last_name"
> & {
  partner_first_name: string | null;
  partner_last_name: string | null;
  registration_sessions: { session_id: string }[];
};

// A stored registration, shaped to fill the form on the edit pages.
export function registrationDefaults(reg: StoredRegistration): RegistrationDefaults {
  return {
    seat_type: reg.seat_type,
    session_ids: reg.registration_sessions.map((s) => s.session_id),
    first_name: reg.first_name,
    last_name: reg.last_name,
    partner_first_name: reg.partner_first_name ?? "",
    partner_last_name: reg.partner_last_name ?? "",
    email: reg.email,
    phone: reg.phone,
    group_language: reg.group_language,
    outline_language: reg.outline_language,
    second_outline_language: reg.second_outline_language,
    comments: reg.comments,
  };
}
