import type { TrainingWithSessions } from "@/lib/data";
import type { Language } from "@/lib/domain/types";
import { sessionLabel } from "@/lib/format";

import type { PaymentDetails, SessionOption } from "./types";

// The training data the registration form needs, shaped for its props. Used by
// both the register and the edit route.
export function trainingFormProps(
  training: TrainingWithSessions,
  locale: Language,
  messageWord: (number: number) => string,
): {
  sessions: SessionOption[];
  prices: { feeCents: number; outlinePriceCents: number };
  payment: PaymentDetails;
  rules: string;
} {
  return {
    sessions: training.sessions.map((s) => ({
      id: s.id,
      label: sessionLabel(s, locale, messageWord(s.message_number)),
    })),
    prices: { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents },
    payment: {
      payee: training.payee_name,
      iban: training.payee_iban,
      reference: training.payment_reference,
    },
    rules: training.rules[locale] ?? "",
  };
}
