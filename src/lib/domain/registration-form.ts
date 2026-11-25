import type { FeeBreakdown } from "./fees";
import type { Language, SeatType } from "./types";

export type RegistrationFormFields = {
  seatType: SeatType;
  outline: Language;
  second: Language | "";
  locality: string;
  otherLocality: string;
  siteId: string;
};

export type RegistrationActionResult =
  | { status: "idle" | "error" | "duplicate" | "closed" | "saved" | "stale" }
  | { status: "done"; calendarUrl: string };

export type RegistrationReceipt<TSummary> = {
  fees: FeeBreakdown;
  summary: TSummary;
};

export type RegistrationFormView<TSummary> =
  | { phase: "editing"; sessionsMissing: boolean }
  | { phase: "submitting"; pendingReceipt: RegistrationReceipt<TSummary> }
  | { phase: "receipt"; calendarUrl: string; receipt: RegistrationReceipt<TSummary> };

export type RegistrationFormState<TSummary> = {
  fields: RegistrationFormFields;
  formKey: number;
  actionStatus: RegistrationActionResult["status"];
  view: RegistrationFormView<TSummary>;
};

export type RegistrationFormAction<TSummary> =
  | { type: "set_seat_type"; seatType: SeatType }
  | { type: "set_outline"; outline: Language }
  | { type: "set_second"; second: Language | "" }
  | { type: "set_locality"; locality: string }
  | { type: "set_other_locality"; otherLocality: string }
  | { type: "set_site_id"; siteId: string }
  | { type: "sessions_missing" }
  | { type: "clear_sessions_missing" }
  | { type: "submit_start"; receipt: RegistrationReceipt<TSummary> }
  | { type: "submit_result"; result: RegistrationActionResult }
  | { type: "register_another" };

export type InitialRegistrationFormDefaults = {
  seat_type: SeatType;
  locality_id: string | null;
  other_locality: string;
  site_id: string | null;
  outline_language: Language | null;
  second_outline_language: Language | null;
};

function initialLocality(d: InitialRegistrationFormDefaults | undefined): string {
  if (d?.locality_id) return d.locality_id;
  return d?.other_locality ? "other" : "";
}

function initialSiteId(
  d: InitialRegistrationFormDefaults | undefined,
  siteIds: readonly string[],
): string {
  if (d?.site_id) return d.site_id;
  return siteIds.length === 1 ? (siteIds[0] ?? "") : "";
}

export function initialRegistrationForm<TSummary>(init: {
  defaults: InitialRegistrationFormDefaults | undefined;
  locale: Language;
  siteIds: readonly string[];
}): RegistrationFormState<TSummary> {
  const d = init.defaults;
  return {
    fields: {
      seatType: d?.seat_type ?? "full_time",
      outline: d?.outline_language ?? init.locale,
      second: d?.second_outline_language ?? "",
      locality: initialLocality(d),
      otherLocality: d?.other_locality ?? "",
      siteId: initialSiteId(d, init.siteIds),
    },
    formKey: 0,
    actionStatus: "idle",
    view: { phase: "editing", sessionsMissing: false },
  };
}

// Explicit state machine for the registration/edit form: enforces cross-field
// invariants, captures the submitted receipt snapshot, and manages receipt view.
export function registrationFormReducer<TSummary>(
  state: RegistrationFormState<TSummary>,
  action: RegistrationFormAction<TSummary>,
): RegistrationFormState<TSummary> {
  switch (action.type) {
    case "set_seat_type": {
      const view =
        state.view.phase === "editing" && action.seatType !== "part_time"
          ? { phase: "editing" as const, sessionsMissing: false }
          : state.view;
      return {
        ...state,
        fields: { ...state.fields, seatType: action.seatType },
        view,
      };
    }
    case "set_outline":
      return {
        ...state,
        fields: {
          ...state.fields,
          outline: action.outline,
          second: action.outline === state.fields.second ? "" : state.fields.second,
        },
      };
    case "set_second":
      return {
        ...state,
        fields: {
          ...state.fields,
          second: action.second === state.fields.outline ? "" : action.second,
        },
      };
    case "set_locality":
      return {
        ...state,
        fields: {
          ...state.fields,
          locality: action.locality,
          otherLocality: action.locality === "other" ? state.fields.otherLocality : "",
        },
      };
    case "set_other_locality":
      return {
        ...state,
        fields: { ...state.fields, otherLocality: action.otherLocality },
      };
    case "set_site_id":
      return {
        ...state,
        fields: { ...state.fields, siteId: action.siteId },
      };
    case "sessions_missing":
      return state.view.phase === "editing"
        ? { ...state, view: { phase: "editing", sessionsMissing: true } }
        : state;
    case "clear_sessions_missing":
      return state.view.phase === "editing" && state.view.sessionsMissing
        ? { ...state, view: { phase: "editing", sessionsMissing: false } }
        : state;
    case "submit_start":
      return {
        ...state,
        view: { phase: "submitting", pendingReceipt: action.receipt },
      };
    case "submit_result": {
      if (action.result.status === "done" && state.view.phase === "submitting") {
        return {
          ...state,
          actionStatus: "done",
          view: {
            phase: "receipt",
            calendarUrl: action.result.calendarUrl,
            receipt: state.view.pendingReceipt,
          },
        };
      }
      return {
        ...state,
        actionStatus: action.result.status,
        view: { phase: "editing", sessionsMissing: false },
      };
    }
    case "register_another":
      return {
        fields: state.fields,
        formKey: state.formKey + 1,
        actionStatus: "idle",
        view: { phase: "editing", sessionsMissing: false },
      };
    default:
      return action satisfies never;
  }
}
