"use client";

import { chakra } from "@chakra-ui/react";
import { useLocale } from "next-intl";
import { useActionState, useState, useTransition, type SyntheticEvent } from "react";

import { computeFees, type FeeBreakdown } from "@/lib/domain/fees";
import {
  isLanguage,
  picksSessions,
  type Language,
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

function initialLocality(d: RegistrationDefaults | undefined) {
  if (d?.locality_id) return d.locality_id;
  return d?.other_locality ? "other" : "";
}

function initialSiteId(d: RegistrationDefaults | undefined, sites: readonly SiteOption[]) {
  if (d?.site_id) return d.site_id;
  return sites.length === 1 ? (sites[0]?.id ?? "") : "";
}

function formFees(
  seatType: SeatType,
  outline: Language,
  second: Language | "",
  prices: { feeCents: number; outlinePriceCents: number },
) {
  const anaheim = seatType === "anaheim";
  return computeFees(
    {
      seatType,
      outlineLanguage: anaheim ? null : outline,
      secondOutlineLanguage: anaheim ? null : second || null,
    },
    prices,
  );
}

// The registration form on both the register and the edit page. It owns the
// form state and shares it with the sections through RegistrationFormContext.
export function RegistrationForm(props: Props) {
  const locale = useLocale();
  const d = props.defaults;

  const [state, formAction, pending] = useActionState<ActionState, FormData>(props.action, {
    status: "idle",
  });
  const [, startTransition] = useTransition();
  const [seatType, setSeatType] = useState<SeatType>(d?.seat_type ?? "full_time");
  const [outline, setOutline] = useState<Language>(d?.outline_language ?? locale);
  const [second, setSecond] = useState<Language | "">(d?.second_outline_language ?? "");
  const [locality, setLocality] = useState(() => initialLocality(d));
  const [otherLocality, setOtherLocality] = useState(d?.other_locality ?? "");
  const [siteId, setSiteId] = useState(() => initialSiteId(d, props.sites));
  const [sessionsMissing, setSessionsMissing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  // The form as it was sent. Fields stay editable while the request runs, so
  // the receipt must not use live state.
  const [submitted, setSubmitted] = useState<{ fees: FeeBreakdown; summary: SubmittedSummary }>();
  // The result whose receipt was closed with "Register another person". A new
  // submission yields a new state object, so its receipt shows again only once
  // that submission has actually succeeded.
  const [dismissedResult, setDismissedResult] = useState<ActionState | null>(null);

  const fees = formFees(seatType, outline, second, props.prices);

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
      setSessionsMissing(true);
      e.currentTarget.querySelector<HTMLInputElement>('input[name="session_ids"]')?.focus();
      return;
    }
    setSessionsMissing(false);
    setSubmitted({
      fees,
      summary: summarize(form, seatType, props.localities, props.sites),
    });
    startTransition(() => formAction(form));
  }

  function changeOutline(next: Language) {
    setOutline(next);
    // Keep the second outline clear once the primary language matches it, so
    // the receipt and form stay in sync and never charge for two outlines.
    if (next === second) setSecond("");
  }

  function changeLocality(next: string) {
    setLocality(next);
    if (next !== "other") setOtherLocality("");
  }

  function registerAnother() {
    setDismissedResult(state);
    // Seat type, languages, locality and site often carry over within a family, so they stay.
    setFormKey((k) => k + 1);
  }

  if (state.status === "done" && state !== dismissedResult && submitted) {
    return (
      <Receipt
        fees={submitted.fees}
        summary={submitted.summary}
        sessionCount={props.sessions.length}
        payment={props.payment}
        calendarUrl={state.calendarUrl}
        onRegisterAnother={registerAnother}
      />
    );
  }

  return (
    <RegistrationFormContext
      value={{
        state: { seatType, outline, second, locality, otherLocality, siteId },
        actions: {
          setSeatType,
          setOutline: changeOutline,
          setSecond,
          setLocality: changeLocality,
          setOtherLocality,
          setSiteId,
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
      <chakra.form key={formKey} onSubmit={onSubmit} display="flex" flexDirection="column" gap="10">
        {props.version && <input type="hidden" name="version" value={props.version} />}
        <SeatSection />
        {picksSessions(seatType) && (
          <SessionsSection
            sessions={props.sessions}
            missing={sessionsMissing}
            onPick={() => setSessionsMissing(false)}
          />
        )}
        <AboutYouSection />
        <LanguagesSection />
        <ConfirmSection />
        <SubmitArea
          status={state.status}
          // Hidden while sending, so each answer mounts afresh and takes focus.
          message={pending ? undefined : props.messages[state.status]}
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
