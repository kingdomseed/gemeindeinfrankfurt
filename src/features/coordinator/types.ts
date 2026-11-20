import type { CoordinatorRegistration } from "@/lib/coordinator";
import type { FeeBreakdown } from "@/lib/domain/fees";

// A registration with what it owes, as the lists show it.
export type RegistrationRow = { registration: CoordinatorRegistration; fees: FeeBreakdown };

// What a coordinator's form action answers; the form maps status to text.
export type FormState = { status: "idle" | "saved" | "error" };
