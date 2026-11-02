import type { CoordinatorRegistration } from "@/lib/coordinator";
import type { FeeBreakdown } from "@/lib/domain/fees";

export type PaymentField = "fee_paid" | "outline_paid";

export type SetPaymentFlag = (input: {
  id: string;
  field: PaymentField;
  value: boolean;
}) => Promise<void>;

// A registration with what it owes, as the lists show it.
export type RegistrationRow = { registration: CoordinatorRegistration; fees: FeeBreakdown };
