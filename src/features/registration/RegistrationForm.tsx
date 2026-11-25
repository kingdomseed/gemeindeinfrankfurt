"use client";

import { chakra } from "@chakra-ui/react";
import { useLocale } from "next-intl";
import { useReducer, useTransition, type SyntheticEvent } from "react";

import { computeFees } from "@/lib/domain/fees";
import { initialRegistrationForm, registrationFormReducer } from "@/lib/domain/registration-form";
import {
  isLanguage,
  picksSessions,
  type LocalityOption,
  type SeatType,
  type SiteOption,
} from "@/lib/domain/types";

import { AboutYouSection } from "./AboutYouSection";
import { ConfirmSection } from "./ConfirmSection";
import { LanguagesSection } from "./LanguagesSection";
import { Receipt } from "./Receipt";
import { RegistrationFormContext } from "./RegistrationFormContext";
import { SeatSection } from "./SeatSection";
import { SessionsSection } from "./SessionsSection";
import { SubmitArea } from "./SubmitArea";
import type {
  ActionState,
  ActionStatus,
  PaymentDetails,
  RegistrationDefaults,
  SessionOption,
  SubmittedSummary,
} from "./types";

type Props = {
  sessions: SessionOption[];
  localities: LocalityOption[];
  sites: SiteOption[];
  prices: { feeCents: number; outlinePriceCents: number };
  payment: PaymentDetails;
  defaults?: RegistrationDefaults;
  version?: string;
  seatLocked?: boolean;
  submitLabel: string;
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  // Text shown after a submit, for each status this form's action can answer.
  messages: Partial<Record<ActionStatus, string>>;
};

// The registration form on both the register and the edit page. It owns the
// form state machine and shares it with the sections through RegistrationFormContext.
export function RegistrationForm(props: Props) {
  const locale = useLocale();
  const d = props.defaults;

  const [state, dispatch] = useReducer(registrationFormReducer<SubmittedSummary>, undefined, () =>
    initialRegistrationForm<SubmittedSummary>({
      defaults: d,
      locale,
      siteIds: props.sites.map((s) => s.id),
    }),
  );
  const [transitionPending, startTransition] = useTransition();

  const { seatType, outline, second } = state.fields;
  const anaheim = seatType === "anaheim";
  const fees = computeFees(
    {
      seatType,
      outlineLanguage: anaheim ? null : outline,
      secondOutlineLanguage: anaheim ? null : second || null,
    },
    props.prices,
  );
  const pending = state.view.phase === "submitting" || transitionPending;

  // Submitting through a transition (instead of <form action>) keeps what the
  // person typed when the server answers with an error: React would otherwise
  // reset every uncontrolled field and the seat radio after the action.
  function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // A locked seat keeps its stored sessions (the server restores them), and
    // its disabled checkboxes are not sent, so only check editable selections.
    const missingSessions =
      !props.seatLocked && seatType === "part_time" && form.getAll("session_ids").length === 0;
    if (missingSessions) {
      dispatch({ type: "sessions_missing" });
      e.currentTarget.querySelector<HTMLInputElement>('input[name="session_ids"]')?.focus();
      return;
    }
    dispatch({
      type: "submit_start",
      receipt: {
        fees,
        summary: summarize(form, seatType, props.localities, props.sites),
      },
    });
    startTransition(async () => {
      try {
        const result = await props.action({ status: "idle" }, form);
        dispatch({ type: "submit_result", result });
      } catch {
        dispatch({ type: "submit_result", result: { status: "error" } });
      }
    });
  }

  if (state.view.phase === "receipt") {
    return (
      <Receipt
        fees={state.view.receipt.fees}
        summary={state.view.receipt.summary}
        sessionCount={props.sessions.length}
        payment={props.payment}
        calendarUrl={state.view.calendarUrl}
        onRegisterAnother={() => dispatch({ type: "register_another" })}
      />
    );
  }

  const sessionsMissing = state.view.phase === "editing" && state.view.sessionsMissing;

  return (
    <RegistrationFormContext
      value={{
        state: state.fields,
        actions: {
          setSeatType: (next) => dispatch({ type: "set_seat_type", seatType: next }),
          setOutline: (next) => dispatch({ type: "set_outline", outline: next }),
          setSecond: (next) => dispatch({ type: "set_second", second: next }),
          setLocality: (next) => dispatch({ type: "set_locality", locality: next }),
          setOtherLocality: (next) => dispatch({ type: "set_other_locality", otherLocality: next }),
          setSiteId: (next) => dispatch({ type: "set_site_id", siteId: next }),
        },
        meta: {
          defaults: d,
          locked: Boolean(props.seatLocked),
          feeCents: props.prices.feeCents,
          localities: props.localities,
          sites: props.sites,
        },
      }}
    >
      <chakra.form
        key={state.formKey}
        onSubmit={onSubmit}
        display="flex"
        flexDirection="column"
        gap="10"
      >
        {props.version && <input type="hidden" name="version" value={props.version} />}
        <SeatSection />
        {picksSessions(seatType) && (
          <SessionsSection
            sessions={props.sessions}
            missing={sessionsMissing}
            onPick={() => dispatch({ type: "clear_sessions_missing" })}
          />
        )}
        <AboutYouSection />
        <LanguagesSection />
        <ConfirmSection />
        <SubmitArea
          status={state.actionStatus}
          // Hidden while sending, so each answer mounts afresh and takes focus.
          message={pending ? undefined : props.messages[state.actionStatus]}
          pending={pending}
          label={props.submitLabel}
        />
      </chakra.form>
    </RegistrationFormContext>
  );
}

function summarize(
  form: FormData,
  seatType: SeatType,
  localities: readonly LocalityOption[],
  sites: readonly SiteOption[],
): SubmittedSummary {
  const text = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v.trim() : "";
  };
  const language = (name: string) => {
    const v = text(name);
    return isLanguage(v) ? v : null;
  };
  const rawLocality = text("locality");
  const locality =
    rawLocality === "other"
      ? text("other_locality") || null
      : (localities.find((l) => l.id === rawLocality)?.name ?? null);
  const siteId = text("site_id");
  const site = sites.find((s) => s.id === siteId)?.name ?? null;
  const partner =
    seatType === "shared" ? ` + ${text("partner_first_name")} ${text("partner_last_name")}` : "";
  return {
    name: `${text("first_name")} ${text("last_name")}${partner}`,
    email: text("email"),
    locality,
    site,
    seatType,
    chosenSessions: picksSessions(seatType) ? form.getAll("session_ids").length : null,
    groupLanguage: language("group_language") ?? "de",
    outlineLanguage: language("outline_language"),
    secondOutlineLanguage: language("second_outline_language"),
  };
}
