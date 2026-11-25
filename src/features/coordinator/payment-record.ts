import type { RegistrationDetail } from "@/lib/coordinator";

// The part of a registration that the payment form shows and saves.
export type PaymentRecord = Pick<
  RegistrationDetail["registration"],
  | "seat_type"
  | "payment_updated_at"
  | "fee_paid"
  | "fee_paid_on"
  | "fee_transaction"
  | "outline_paid"
  | "outline_paid_on"
  | "outline_transaction"
  | "waiver"
  | "waiver_reason"
>;

// Only these fields go to the browser, not the whole stored row.
export function toPaymentRecord(reg: RegistrationDetail["registration"]): PaymentRecord {
  return {
    seat_type: reg.seat_type,
    payment_updated_at: reg.payment_updated_at,
    fee_paid: reg.fee_paid,
    fee_paid_on: reg.fee_paid_on,
    fee_transaction: reg.fee_transaction,
    outline_paid: reg.outline_paid,
    outline_paid_on: reg.outline_paid_on,
    outline_transaction: reg.outline_transaction,
    waiver: reg.waiver,
    waiver_reason: reg.waiver_reason,
  };
}
