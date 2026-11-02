"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { computeFees, formatEuro } from "@/lib/domain/fees";
import { isLanguage, languages, type Language, type SeatType } from "@/lib/domain/types";

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

const field =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900";

export function RegistrationForm(props: Props) {
  const t = useTranslations("register");
  const tl = useTranslations("common.languages");
  const locale = useLocale();
  const d = props.defaults;
  const isEdit = Boolean(d);
  const chosenSessions = new Set(d?.session_ids);

  const [state, formAction, pending] = useActionState(props.action, { status: "idle" });
  const [seatType, setSeatType] = useState<SeatType>(d?.seat_type ?? "full_time");
  const [outline, setOutline] = useState<Language>(d?.outline_language ?? locale);
  const [second, setSecond] = useState<Language | "">(d?.second_outline_language ?? "");
  const [anaheim, setAnaheim] = useState(d?.attended_anaheim ?? false);
  const [ukraine, setUkraine] = useState(d?.ukraine_not_employed ?? false);

  if (state.status === "done") {
    return <p className="rounded bg-green-50 p-4 text-green-900">{props.messages.done}</p>;
  }

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

  const languageOptions = languages.map((l) => (
    <option key={l} value={l}>
      {tl(l)}
    </option>
  ));

  return (
    <form action={formAction} className="space-y-6">
      {props.messages[state.status] && (
        <output className="block rounded bg-amber-50 p-3 text-amber-900">
          {props.messages[state.status]}
        </output>
      )}

      <fieldset disabled={props.seatLocked}>
        <legend className="font-semibold">{t("seatType")}</legend>
        {(["full_time", "part_time", "shared"] as const).map((s) => (
          <label key={s} className="mt-2 flex items-center gap-2">
            <input
              type="radio"
              name="seat_type"
              value={s}
              checked={seatType === s}
              onChange={() => setSeatType(s)}
            />
            {t(`seat.${s}`)}
          </label>
        ))}
      </fieldset>

      {seatType === "part_time" && (
        <fieldset disabled={props.seatLocked}>
          <legend className="font-semibold">{t("sessions")}</legend>
          {props.sessions.map((s) => (
            <label key={s.id} className="mt-1 flex items-center gap-2">
              <input
                type="checkbox"
                name="session_ids"
                value={s.id}
                defaultChecked={chosenSessions.has(s.id)}
              />
              {s.label}
            </label>
          ))}
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Text name="first_name" label={t("firstName")} value={d?.first_name} required />
        <Text name="last_name" label={t("lastName")} value={d?.last_name} required />
        {seatType === "shared" && (
          <>
            <Text
              name="partner_first_name"
              label={t("partnerFirstName")}
              value={d?.partner_first_name}
              required
              disabled={props.seatLocked}
            />
            <Text
              name="partner_last_name"
              label={t("partnerLastName")}
              value={d?.partner_last_name}
              required
              disabled={props.seatLocked}
            />
          </>
        )}
        <Text name="email" type="email" label={t("email")} value={d?.email} required />
        <Text name="phone" type="tel" label={t("phone")} value={d?.phone} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          {t("groupLanguage")}
          <select
            name="group_language"
            defaultValue={d?.group_language ?? locale}
            className={field}
          >
            {languageOptions}
          </select>
        </label>
        <label>
          {t("outlineLanguage")}
          <select
            name="outline_language"
            value={outline}
            onChange={(e) => {
              if (isLanguage(e.target.value)) setOutline(e.target.value);
            }}
            className={field}
          >
            {languageOptions}
          </select>
        </label>
        <label>
          {t("secondOutlineLanguage")}
          <select
            name="second_outline_language"
            value={second}
            onChange={(e) => {
              const v = e.target.value;
              setSecond(isLanguage(v) ? v : "");
            }}
            className={field}
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

      <label className="block">
        {t("comments")}
        <textarea name="comments" defaultValue={d?.comments} rows={3} className={field} />
      </label>

      <div className="space-y-2">
        <Check
          name="attended_anaheim"
          label={t("attendedAnaheim")}
          checked={anaheim}
          onChange={setAnaheim}
        />
        <Check
          name="ukraine_not_employed"
          label={t("ukraineNotEmployed")}
          checked={ukraine}
          onChange={setUkraine}
        />
      </div>

      <details className="rounded border border-neutral-300 p-3 dark:border-neutral-700">
        <summary className="cursor-pointer font-semibold">{t("rules")}</summary>
        <div className="mt-2 text-sm whitespace-pre-line">{props.rules}</div>
      </details>

      <div className="space-y-2">
        <Check name="confirmed_adult" label={t("confirmAdult")} required defaultChecked={isEdit} />
        <Check name="accepted_rules" label={t("acceptRules")} required defaultChecked={isEdit} />
      </div>

      <section className="rounded bg-neutral-100 p-4 dark:bg-neutral-800">
        <h2 className="font-semibold">{t("toPay")}</h2>
        <p>
          {t("trainingFee")}: {formatEuro(fees.trainingCents, locale)}
        </p>
        <p>
          {t("outlines", { count: fees.outlineCount })}: {formatEuro(fees.outlineCents, locale)}
        </p>
        <p className="mt-2 text-sm">
          {t("payTo", {
            payee: props.payment.payee,
            iban: props.payment.iban,
            reference: props.payment.reference,
          })}
        </p>
      </section>

      {state.status === "duplicate" && (
        <Check name="confirm_duplicate" label={t("registerAnyway")} required />
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-teal-800 px-5 py-2 font-semibold text-white disabled:opacity-50"
      >
        {props.submitLabel}
      </button>
    </form>
  );
}

function Text(props: {
  name: string;
  label: string;
  value?: string | undefined;
  type?: string;
  required?: boolean;
  disabled?: boolean | undefined;
}) {
  return (
    <label>
      {props.label}
      <input
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.value}
        required={props.required}
        disabled={props.disabled}
        className={field}
      />
    </label>
  );
}

function Check(props: {
  name: string;
  label: string;
  required?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const { onChange } = props;
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        name={props.name}
        required={props.required}
        checked={props.checked}
        defaultChecked={props.defaultChecked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="mt-1"
      />
      <span>{props.label}</span>
    </label>
  );
}
