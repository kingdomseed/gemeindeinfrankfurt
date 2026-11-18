"use client";

import { chakra } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, useTransition, type SyntheticEvent } from "react";

import { computeFees, formatEuro } from "@/lib/domain/fees";
import { picksSessions, type Language, type SeatType } from "@/lib/domain/types";

import { AboutYouSection } from "./AboutYouSection";
import { ConfirmSection } from "./ConfirmSection";
import { LanguagesSection } from "./LanguagesSection";
import { Receipt } from "./Receipt";
import { SeatSection } from "./SeatSection";
import { SessionsSection } from "./SessionsSection";
import { SubmitArea } from "./SubmitArea";
import type { ActionState, PaymentDetails, RegistrationDefaults, SessionOption } from "./types";

type Props = {
  sessions: SessionOption[];
  prices: { feeCents: number; outlinePriceCents: number };
  payment: PaymentDetails;
  defaults?: RegistrationDefaults;
  seatLocked?: boolean;
  submitLabel: string;
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  messages: Record<string, string>; // status -> text shown after submit
};

// Statuses that mean the action worked; everything else is shown as a problem.
const successStatuses = new Set(["done", "saved"]);

// The registration form on both the register and the edit page. It owns the
// form state; each section only renders its fields.
export function RegistrationForm(props: Props) {
  const locale = useLocale();
  const t = useTranslations("register");
  const d = props.defaults;

  const [state, formAction, pending] = useActionState(props.action, { status: "idle" });
  const [, startTransition] = useTransition();
  const [seatType, setSeatType] = useState<SeatType>(d?.seat_type ?? "full_time");
  const [outline, setOutline] = useState<Language>(d?.outline_language ?? locale);
  const [second, setSecond] = useState<Language | "">(d?.second_outline_language ?? "");
  const [sessionsMissing, setSessionsMissing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  // The total as it was when the form was sent. Seat and outlines stay
  // editable while the request runs, so the receipt must not use live state.
  const [submittedTotal, setSubmittedTotal] = useState(0);
  // The result whose receipt was closed with "Register another person". A new
  // submission yields a new state object, so its receipt shows again only once
  // that submission has actually succeeded.
  const [dismissedResult, setDismissedResult] = useState<ActionState | null>(null);

  const anaheim = seatType === "anaheim";
  const euro = (cents: number) => formatEuro(cents, locale);
  const fees = computeFees(
    {
      seatType,
      outlineLanguage: anaheim ? null : outline,
      secondOutlineLanguage: anaheim ? null : second || null,
    },
    props.prices,
  );

  // Submitting through a transition (instead of <form action>) keeps what the
  // person typed when the server answers with an error: React would otherwise
  // reset every uncontrolled field and the seat radio after the action.
  function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // A locked seat keeps its stored sessions (the server restores them), and
    // its disabled checkboxes are not sent, so only check editable selections.
    if (!props.seatLocked && seatType === "part_time" && form.getAll("session_ids").length === 0) {
      setSessionsMissing(true);
      e.currentTarget.querySelector<HTMLInputElement>('input[name="session_ids"]')?.focus();
      return;
    }
    setSessionsMissing(false);
    setSubmittedTotal(fees.trainingCents + fees.outlineCents);
    startTransition(() => formAction(form));
  }

  function registerAnother() {
    setDismissedResult(state);
    // Seat type and languages often carry over within a family, so they stay.
    setFormKey((k) => k + 1);
  }

  if (state.status === "done" && state !== dismissedResult) {
    return (
      <Receipt
        totalCents={submittedTotal}
        payment={props.payment}
        onRegisterAnother={registerAnother}
      />
    );
  }

  return (
    <chakra.form key={formKey} onSubmit={onSubmit} display="flex" flexDirection="column" gap="10">
      <SeatSection
        value={seatType}
        fee={euro(props.prices.feeCents)}
        onChange={setSeatType}
        locked={props.seatLocked}
      />
      {picksSessions(seatType) && (
        <SessionsSection
          sessions={props.sessions}
          hint={anaheim ? t("sessionsAnaheimHint") : t("sessionsPartHint")}
          chosen={new Set(d?.session_ids)}
          missing={sessionsMissing}
          onPick={() => setSessionsMissing(false)}
          locked={props.seatLocked}
        />
      )}
      <AboutYouSection
        shared={seatType === "shared"}
        defaults={d}
        partnerLocked={props.seatLocked}
      />
      <LanguagesSection
        groupLanguage={d?.group_language ?? locale}
        needsOutline={!anaheim}
        outline={outline}
        second={second}
        onOutline={setOutline}
        onSecond={setSecond}
        comments={d?.comments}
      />
      <ConfirmSection confirmed={Boolean(d)} />
      <SubmitArea
        // Hidden while sending, so each answer mounts afresh and takes focus.
        message={pending || state.status === "done" ? undefined : props.messages[state.status]}
        success={successStatuses.has(state.status)}
        duplicate={state.status === "duplicate"}
        pending={pending}
        label={props.submitLabel}
      />
    </chakra.form>
  );
}
