"use client";

import { useTranslations } from "next-intl";

import { fieldClass } from "@/components/styles";
import { isLanguage, languages, type Language, type SeatType } from "@/lib/domain/types";

import { Choice, Section, Text } from "./fields";
import { focusOnMount } from "./focus";

export type SessionOption = { id: string; label: string };

const seatTypes = ["full_time", "part_time", "shared"] as const;

export function SeatSection(props: {
  value: SeatType;
  onChange: (s: SeatType) => void;
  locked?: boolean | undefined;
}) {
  const t = useTranslations("register");
  return (
    <Section legend={t("seatType")} disabled={props.locked}>
      <div className="space-y-1">
        {seatTypes.map((s) => (
          <Choice
            key={s}
            type="radio"
            name="seat_type"
            value={s}
            checked={props.value === s}
            onChange={() => props.onChange(s)}
          >
            {t(`seat.${s}`)}
          </Choice>
        ))}
      </div>
    </Section>
  );
}

export function SessionsSection(props: {
  sessions: SessionOption[];
  chosen: ReadonlySet<string>;
  missing: boolean;
  onPick: () => void;
  locked?: boolean | undefined;
}) {
  const t = useTranslations("register");
  return (
    <Section legend={t("sessions")} disabled={props.locked}>
      {props.missing && (
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
            defaultChecked={props.chosen.has(s.id)}
            describedBy={props.missing ? "sessions-error" : undefined}
            onChange={props.onPick}
          >
            <span className="tabular-nums">{s.label}</span>
          </Choice>
        ))}
      </div>
    </Section>
  );
}

export type PersonDefaults = {
  first_name: string;
  last_name: string;
  partner_first_name: string;
  partner_last_name: string;
  email: string;
  phone: string;
};

export function AboutYouSection(props: {
  shared: boolean;
  defaults?: PersonDefaults | undefined;
  partnerLocked?: boolean | undefined;
}) {
  const t = useTranslations("register");
  const d = props.defaults;
  return (
    <Section legend={t("sectionAboutYou")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text
          name="first_name"
          autoComplete="given-name"
          label={t("firstName")}
          value={d?.first_name}
          required
        />
        <Text
          name="last_name"
          autoComplete="family-name"
          label={t("lastName")}
          value={d?.last_name}
          required
        />
        {props.shared && (
          <>
            <Text
              name="partner_first_name"
              autoComplete="off"
              label={t("partnerFirstName")}
              value={d?.partner_first_name}
              required
              disabled={props.partnerLocked}
            />
            <Text
              name="partner_last_name"
              autoComplete="off"
              label={t("partnerLastName")}
              value={d?.partner_last_name}
              required
              disabled={props.partnerLocked}
            />
          </>
        )}
        <Text
          name="email"
          type="email"
          autoComplete="email"
          label={t("email")}
          value={d?.email}
          required
        />
        <Text
          name="phone"
          type="tel"
          autoComplete="tel"
          label={t("phone")}
          hint={t("optional")}
          value={d?.phone}
        />
      </div>
    </Section>
  );
}

export function LanguagesSection(props: {
  groupLanguage: Language;
  outline: Language;
  second: Language | "";
  onOutline: (l: Language) => void;
  onSecond: (l: Language | "") => void;
  comments?: string | undefined;
}) {
  const t = useTranslations("register");
  const tl = useTranslations("common.languages");
  const options = (list: readonly Language[]) =>
    list.map((l) => (
      <option key={l} value={l}>
        {tl(l)}
      </option>
    ));
  return (
    <Section legend={t("sectionLanguages")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          {t("groupLanguage")}
          <select name="group_language" defaultValue={props.groupLanguage} className={fieldClass}>
            {options(languages)}
          </select>
        </label>
        <label className="block">
          {t("outlineLanguage")}
          <select
            name="outline_language"
            value={props.outline}
            onChange={(e) => {
              if (isLanguage(e.target.value)) props.onOutline(e.target.value);
            }}
            className={fieldClass}
          >
            {options(languages)}
          </select>
        </label>
        <label className="block">
          {t("secondOutlineLanguage")}
          <select
            name="second_outline_language"
            value={props.second}
            onChange={(e) => {
              const v = e.target.value;
              props.onSecond(isLanguage(v) ? v : "");
            }}
            className={fieldClass}
          >
            <option value="">{t("none")}</option>
            {options(languages.filter((l) => l !== props.outline))}
          </select>
        </label>
      </div>
      <label className="mt-4 block">
        {t("comments")} <span className="text-sm text-muted">({t("optional")})</span>
        <textarea name="comments" defaultValue={props.comments} rows={3} className={fieldClass} />
      </label>
    </Section>
  );
}

export function FreeSeatSection(props: {
  anaheim: boolean;
  ukraine: boolean;
  onAnaheim: (v: boolean) => void;
  onUkraine: (v: boolean) => void;
}) {
  const t = useTranslations("register");
  return (
    <Section legend={t("sectionFreeSeat")}>
      <p className="mb-2 text-sm text-muted">{t("freeSeatHelp")}</p>
      <div className="space-y-1">
        <Choice
          type="checkbox"
          name="attended_anaheim"
          checked={props.anaheim}
          onChange={(e) => props.onAnaheim(e.target.checked)}
        >
          {t("attendedAnaheim")}
        </Choice>
        <Choice
          type="checkbox"
          name="ukraine_not_employed"
          checked={props.ukraine}
          onChange={(e) => props.onUkraine(e.target.checked)}
        >
          {t("ukraineNotEmployed")}
        </Choice>
      </div>
    </Section>
  );
}

export function ConfirmSection(props: { rules: string; confirmed: boolean }) {
  const t = useTranslations("register");
  return (
    <Section legend={t("sectionConfirm")}>
      {props.rules && (
        <div className="mb-3 rounded-lg border border-line p-4">
          <h3 className="font-semibold">{t("rules")}</h3>
          <p className="mt-1 text-sm whitespace-pre-line">{props.rules}</p>
        </div>
      )}
      <div className="space-y-1">
        <Choice type="checkbox" name="confirmed_adult" required defaultChecked={props.confirmed}>
          {t("confirmAdult")}
        </Choice>
        <Choice type="checkbox" name="accepted_rules" required defaultChecked={props.confirmed}>
          {t("acceptRules")}
        </Choice>
      </div>
    </Section>
  );
}

// The answer to the last submit, next to the button where the person is looking.
export function SubmitArea(props: {
  message?: string | undefined;
  success: boolean;
  duplicate: boolean;
  pending: boolean;
  label: string;
}) {
  const t = useTranslations("register");
  return (
    <div className="space-y-4">
      {props.message &&
        (props.success ? (
          <output
            ref={focusOnMount}
            tabIndex={-1}
            className="block rounded-lg bg-success-bg p-4 text-success-ink outline-none"
          >
            {props.message}
          </output>
        ) : (
          <p
            ref={focusOnMount}
            tabIndex={-1}
            role="alert"
            className="rounded-lg bg-warning-bg p-4 text-warning-ink outline-none"
          >
            {props.message}
          </p>
        ))}
      {props.duplicate && (
        <Choice type="checkbox" name="confirm_duplicate" required>
          {t("registerAnyway")}
        </Choice>
      )}
      <button
        type="submit"
        disabled={props.pending}
        className="min-h-11 rounded-md bg-brand px-6 py-2.5 font-semibold text-brand-ink hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
      >
        {props.pending ? t("sending") : props.label}
      </button>
    </div>
  );
}
