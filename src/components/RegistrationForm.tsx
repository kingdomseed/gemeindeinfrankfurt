"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { fieldClass } from "@/components/styles";
import { computeFees, formatEuro } from "@/lib/domain/fees";
import { languages, type Language, type SeatType } from "@/lib/domain/types";

export type SessionOption = { id: string; label: string };

export type RegistrationDefaults = {
  seat_type: SeatType;
  session_ids: string[];
  first_name: string;
  last_name: string;
  partner_first_name: string;
  partner_last_name: string;
  email: string;
  phone: string;
  group_language: Language;
  outline_language: Language;
  second_outline_language: Language | null;
  comments: string;
  attended_anaheim: boolean;
  ukraine_not_employed: boolean;
};

type State = { status: string };

type Props = {
  sessions: SessionOption[];
  prices: { feeCents: number; outlinePriceCents: number };
  payment: { payee: string; iban: string; reference: string };
  rules: string;
  defaults?: RegistrationDefaults;
  seatLocked?: boolean;
  submitLabel: string;
  action: (prev: State, form: FormData) => Promise<State>;
  messages: Record<string, string>; // status -> text shown after submit
};

// Statuses that mean the action worked; everything else is shown as a problem.
const successStatuses = new Set(["done", "saved"]);

export function RegistrationForm(props: Props) {
  const t = useTranslations("register");
  const tl = useTranslations("common.languages");
  const locale = useLocale() as Language;
  const d = props.defaults;
  const isEdit = Boolean(d);

  const [state, formAction, pending] = useActionState(props.action, { status: "idle" });
  const [, startTransition] = useTransition();
  const [seatType, setSeatType] = useState<SeatType>(d?.seat_type ?? "full_time");
  const [outline, setOutline] = useState<Language>(d?.outline_language ?? locale);
  const [second, setSecond] = useState<Language | "">(d?.second_outline_language ?? "");
  const [anaheim, setAnaheim] = useState(d?.attended_anaheim ?? false);
  const [ukraine, setUkraine] = useState(d?.ukraine_not_employed ?? false);
  const [sessionsMissing, setSessionsMissing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [receiptDismissed, setReceiptDismissed] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // "done" is shown as the receipt below, not as a banner.
  const message = state.status === "done" ? undefined : props.messages[state.status];
  useEffect(() => {
    if (message) statusRef.current?.focus();
  }, [state, message]);

  const fees = computeFees(
    {
      seatType,
      attendedAnaheim: anaheim,
      ukraineNotEmployed: ukraine,
      outlineLanguage: outline,
      secondOutlineLanguage: second || null,
    },
    props.prices,
  );
  const euro = (cents: number) => formatEuro(cents, locale);
  const total = fees.trainingCents + fees.outlineCents;

  // Submitting through a transition (instead of <form action>) keeps what the
  // person typed when the server answers with an error: React would otherwise
  // reset every uncontrolled field and the seat radio after the action.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (seatType === "part_time" && form.getAll("session_ids").length === 0) {
      setSessionsMissing(true);
      e.currentTarget.querySelector<HTMLInputElement>('input[name="session_ids"]')?.focus();
      return;
    }
    setSessionsMissing(false);
    setReceiptDismissed(false);
    startTransition(() => formAction(form));
  }

  if (state.status === "done" && !receiptDismissed) {
    return (
      <section
        ref={(el) => el?.focus()}
        tabIndex={-1}
        role="status"
        className="space-y-4 rounded-xl bg-success-bg p-5 text-success-ink outline-none"
      >
        <h2 className="text-xl font-semibold">{t("receiptTitle")}</h2>
        <p>{t("receiptBody")}</p>
        {total > 0 && (
          <div className="rounded-lg bg-background p-4 text-foreground">
            <p className="font-semibold">{t("receiptPay", { total: euro(total) })}</p>
            <TransferDetails payment={props.payment} />
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setReceiptDismissed(true);
            setFormKey((k) => k + 1);
          }}
          className="font-semibold underline"
        >
          {t("registerAnother")}
        </button>
      </section>
    );
  }

  const languageOptions = languages.map((l) => (
    <option key={l} value={l}>
      {tl(l)}
    </option>
  ));

  return (
    <form key={formKey} onSubmit={onSubmit} className="space-y-10">
      <Section legend={t("seatType")} disabled={props.seatLocked}>
        <div className="space-y-1">
          {(["full_time", "part_time", "shared"] as const).map((s) => (
            <Choice key={s} type="radio" name="seat_type" value={s} checked={seatType === s} onChange={() => setSeatType(s)}>
              {t(`seat.${s}`)}
            </Choice>
          ))}
        </div>
      </Section>

      {seatType === "part_time" && (
        <Section legend={t("sessions")} disabled={props.seatLocked}>
          {sessionsMissing && (
            <p id="sessions-error" className="mb-2 font-semibold text-danger">
              {t("sessionsRequired")}
            </p>
          )}
          <div className="grid gap-x-6 sm:grid-cols-2">
            {props.sessions.map((s) => (
              <Choice
                key={s.id}
                type="checkbox"
                name="session_ids"
                value={s.id}
                defaultChecked={d?.session_ids.includes(s.id)}
                describedBy={sessionsMissing ? "sessions-error" : undefined}
                onChange={() => setSessionsMissing(false)}
              >
                <span className="tabular-nums">{s.label}</span>
              </Choice>
            ))}
          </div>
        </Section>
      )}

      <Section legend={t("sectionAboutYou")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="first_name" autoComplete="given-name" label={t("firstName")} value={d?.first_name} required />
          <Text name="last_name" autoComplete="family-name" label={t("lastName")} value={d?.last_name} required />
          {seatType === "shared" && (
            <>
              <Text name="partner_first_name" autoComplete="off" label={t("partnerFirstName")} value={d?.partner_first_name} required disabled={props.seatLocked} />
              <Text name="partner_last_name" autoComplete="off" label={t("partnerLastName")} value={d?.partner_last_name} required disabled={props.seatLocked} />
            </>
          )}
          <Text name="email" type="email" autoComplete="email" label={t("email")} value={d?.email} required />
          <Text name="phone" type="tel" autoComplete="tel" label={t("phone")} hint={t("optional")} value={d?.phone} />
        </div>
      </Section>

      <Section legend={t("sectionLanguages")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            {t("groupLanguage")}
            <select name="group_language" defaultValue={d?.group_language ?? locale} className={fieldClass}>
              {languageOptions}
            </select>
          </label>
          <label className="block">
            {t("outlineLanguage")}
            <select
              name="outline_language"
              value={outline}
              onChange={(e) => setOutline(e.target.value as Language)}
              className={fieldClass}
            >
              {languageOptions}
            </select>
          </label>
          <label className="block">
            {t("secondOutlineLanguage")}
            <select
              name="second_outline_language"
              value={second}
              onChange={(e) => setSecond(e.target.value as Language | "")}
              className={fieldClass}
            >
              <option value="">{t("none")}</option>
              {languages
                .filter((l) => l !== outline)
                .map((l) => (
                  <option key={l} value={l}>
                    {tl(l)}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          {t("comments")} <span className="text-sm text-muted">({t("optional")})</span>
          <textarea name="comments" defaultValue={d?.comments} rows={3} className={fieldClass} />
        </label>
      </Section>

      <Section legend={t("sectionFreeSeat")}>
        <p className="mb-2 text-sm text-muted">{t("freeSeatHelp")}</p>
        <div className="space-y-1">
          <Choice type="checkbox" name="attended_anaheim" checked={anaheim} onChange={(e) => setAnaheim(e.target.checked)}>
            {t("attendedAnaheim")}
          </Choice>
          <Choice type="checkbox" name="ukraine_not_employed" checked={ukraine} onChange={(e) => setUkraine(e.target.checked)}>
            {t("ukraineNotEmployed")}
          </Choice>
        </div>
      </Section>

      <section aria-labelledby="payment-heading" className="rounded-xl bg-brand-soft p-5">
        <h2 id="payment-heading" className="text-lg font-semibold">
          {t("sectionPayment")}
        </h2>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 tabular-nums">
          <dt>{t("trainingFee")}</dt>
          <dd className="text-right">
            {fees.waived ? (
              <>
                <span className="text-sm text-muted">{t("waived")}</span> {euro(0)}
              </>
            ) : (
              euro(fees.trainingCents)
            )}
          </dd>
          <dt>{t("outlines", { count: fees.outlineCount })}</dt>
          <dd className="text-right">{euro(fees.outlineCents)}</dd>
        </dl>
        <dl className="mt-2 flex items-baseline justify-between border-t border-line-strong pt-2 font-semibold tabular-nums">
          <dt>{t("total")}</dt>
          <dd className="text-lg">{euro(total)}</dd>
        </dl>
        <p className="mt-4 text-sm text-muted">{t("payHint")}</p>
        <TransferDetails payment={props.payment} />
      </section>

      <Section legend={t("sectionConfirm")}>
        {props.rules && (
          <div className="mb-3 rounded-lg border border-line p-4">
            <h3 className="font-semibold">{t("rules")}</h3>
            <p className="mt-1 whitespace-pre-line text-sm">{props.rules}</p>
          </div>
        )}
        <div className="space-y-1">
          <Choice type="checkbox" name="confirmed_adult" required defaultChecked={isEdit}>
            {t("confirmAdult")}
          </Choice>
          <Choice type="checkbox" name="accepted_rules" required defaultChecked={isEdit}>
            {t("acceptRules")}
          </Choice>
        </div>
      </Section>

      <div className="space-y-4">
        {message && (
          <p
            ref={statusRef}
            tabIndex={-1}
            role={successStatuses.has(state.status) ? "status" : "alert"}
            className={`rounded-lg p-4 outline-none ${
              successStatuses.has(state.status) ? "bg-success-bg text-success-ink" : "bg-warning-bg text-warning-ink"
            }`}
          >
            {message}
          </p>
        )}

        {state.status === "duplicate" && (
          <Choice type="checkbox" name="confirm_duplicate" required>
            {t("registerAnyway")}
          </Choice>
        )}

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-md bg-brand px-6 py-2.5 font-semibold text-brand-ink hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? t("sending") : props.submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section(props: { legend: string; disabled?: boolean; children: ReactNode }) {
  return (
    <fieldset disabled={props.disabled} className="min-w-0 disabled:opacity-70">
      <legend className="mb-3 text-lg font-semibold">{props.legend}</legend>
      {props.children}
    </fieldset>
  );
}

function TransferDetails({ payment }: { payment: Props["payment"] }) {
  const t = useTranslations("register");
  return (
    <dl className="mt-2 grid gap-y-2 sm:grid-cols-[auto_1fr] sm:gap-x-6">
      <dt className="text-sm text-muted">{t("payee")}</dt>
      <dd>{payment.payee}</dd>
      <dt className="text-sm text-muted">{t("iban")}</dt>
      <dd className="flex flex-wrap items-center gap-x-3">
        <span className="font-mono tabular-nums select-all">{payment.iban}</span>
        <CopyButton value={payment.iban.replace(/\s/g, "")} />
      </dd>
      <dt className="text-sm text-muted">{t("reference")}</dt>
      <dd className="flex flex-wrap items-center gap-x-3">
        <span className="select-all">{payment.reference}</span>
        <CopyButton value={payment.reference} />
      </dd>
    </dl>
  );
}

function CopyButton({ value }: { value: string }) {
  const t = useTranslations("register");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="min-h-8 rounded-md border border-line-strong px-2 text-sm hover:bg-background"
    >
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
}

function Text(props: {
  name: string;
  label: string;
  value?: string;
  type?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      {props.label}
      {props.hint && <span className="text-sm text-muted"> ({props.hint})</span>}
      <input
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.value}
        required={props.required}
        disabled={props.disabled}
        autoComplete={props.autoComplete}
        className={fieldClass}
      />
    </label>
  );
}

function Choice(props: {
  type: "radio" | "checkbox";
  name: string;
  value?: string;
  required?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  describedBy?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
      <input
        type={props.type}
        name={props.name}
        value={props.value}
        required={props.required}
        checked={props.checked}
        defaultChecked={props.defaultChecked}
        aria-describedby={props.describedBy}
        onChange={props.onChange}
        className="mt-0.5 size-5 shrink-0"
      />
      <span>{props.children}</span>
    </label>
  );
}
