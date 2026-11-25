import { createContext, use } from "react";

import type { Language, LocalityOption, SeatType, SiteOption } from "@/lib/domain/types";

import type { RegistrationDefaults } from "./types";

// What the registration form's sections share. RegistrationForm owns the
// state; each section reads only what it needs.
export type RegistrationFormContextValue = {
  state: {
    seatType: SeatType;
    outline: Language;
    second: Language | "";
    locality: string;
    otherLocality: string;
    siteId: string;
  };
  actions: {
    setSeatType: (s: SeatType) => void;
    setOutline: (l: Language) => void;
    setSecond: (l: Language | "") => void;
    setLocality: (l: string) => void;
    setOtherLocality: (o: string) => void;
    setSiteId: (s: string) => void;
  };
  meta: {
    // The stored registration on the edit pages; absent when registering.
    defaults: RegistrationDefaults | undefined;
    // Past the cutoff, seat and sessions can no longer change.
    locked: boolean;
    feeCents: number;
    localities: readonly LocalityOption[];
    sites: readonly SiteOption[];
  };
};

export const RegistrationFormContext = createContext<RegistrationFormContextValue | null>(null);

export function useRegistrationForm(): RegistrationFormContextValue {
  const value = use(RegistrationFormContext);
  if (!value) throw new Error("useRegistrationForm must be used inside RegistrationForm");
  return value;
}
