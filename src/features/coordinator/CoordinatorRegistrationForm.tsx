"use client";

import { Button, chakra, Input, SimpleGrid, Span, Text, Textarea } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type SyntheticEvent } from "react";

import { CheckboxChoice, RadioChoices } from "@/components/ui/choice";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { SelectField } from "@/components/ui/select-field";
import { ConfirmRules } from "@/features/registration/ConfirmSection";
import type { RegistrationDefaults, SessionOption } from "@/features/registration/types";
import { formatEuro } from "@/lib/domain/fees";
import {
  isLanguage,
  languages,
  picksSessions,
  seatTypes,
  type Language,
  type LocalityOption,
  type SeatType,
  type SiteOption,
} from "@/lib/domain/types";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import type { FormAction } from "./types";
import { useCollaborativeForm } from "./useCollaborativeForm";

type RegistrationDraft = {
  seat_type: string;
  session_ids: string;
  first_name: string;
  last_name: string;
  partner_first_name: string;
  partner_last_name: string;
  email: string;
  phone: string;
  locality: string;
  other_locality: string;
  site_id: string;
  group_language: string;
  outline_language: string;
  second_outline_language: string;
  comments: string;
};

type EditDraftField = (field: keyof RegistrationDraft, value: string) => void;

function isSeatType(value: string): value is SeatType {
  return seatTypes.some((s) => s === value);
}

function splitSessionIds(value: string): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function joinSessionIds(ids: readonly string[]): string {
  return [...new Set(ids)].toSorted().join(",");
}

function toRegistrationDraft(
  d: RegistrationDefaults,
  sites: readonly SiteOption[],
): RegistrationDraft {
  const anaheim = d.seat_type === "anaheim";
  const locality = d.locality_id ?? (d.other_locality ? "other" : "");
  const fallbackSiteId = sites.length === 1 ? (sites[0]?.id ?? "") : "";
  return {
    seat_type: d.seat_type,
    session_ids: picksSessions(d.seat_type) ? joinSessionIds(d.session_ids) : "",
    first_name: d.first_name,
    last_name: d.last_name,
    partner_first_name: d.seat_type === "shared" ? d.partner_first_name : "",
    partner_last_name: d.seat_type === "shared" ? d.partner_last_name : "",
    email: d.email,
    phone: d.phone,
    locality,
    other_locality: d.locality_id ? "" : d.other_locality,
    site_id: d.site_id ?? fallbackSiteId,
    group_language: d.group_language,
    outline_language: anaheim ? "" : (d.outline_language ?? "de"),
    second_outline_language: anaheim ? "" : (d.second_outline_language ?? ""),
    comments: d.comments,
  };
}

function buildConflictMetadata(params: {
  server: RegistrationDraft;
  sessionsCount: number;
  localities: readonly LocalityOption[];
  sites: readonly SiteOption[];
  tr: ReturnType<typeof useTranslations<"register">>;
  tl: ReturnType<typeof useTranslations<"common.languages">>;
}) {
  const { server, sessionsCount, localities, sites, tr, tl } = params;
  const fieldLabels: Record<keyof RegistrationDraft, string> = {
    seat_type: tr("seatType"),
    session_ids: tr("sessions"),
    first_name: tr("firstName"),
    last_name: tr("lastName"),
    partner_first_name: tr("partnerFirstName"),
    partner_last_name: tr("partnerLastName"),
    email: tr("email"),
    phone: tr("phone"),
    locality: tr("locality"),
    other_locality: tr("otherLocalityLabel"),
    site_id: tr("site"),
    group_language: tr("groupLanguage"),
    outline_language: tr("outlineLanguage"),
    second_outline_language: tr("secondOutlineLanguage"),
    comments: tr("comments"),
  };

  const serverSeat = isSeatType(server.seat_type)
    ? tr(`seat.${server.seat_type}`)
    : server.seat_type;
  const serverLocality =
    server.locality === "other"
      ? tr("otherLocality")
      : (localities.find((l) => l.id === server.locality)?.name ?? server.locality);
  const serverSite = sites.find((s) => s.id === server.site_id)?.name ?? server.site_id;
  const serverSessionIds = splitSessionIds(server.session_ids);
  const langLabel = (code: string) => {
    if (isLanguage(code)) return tl(code);
    return code || tr("none");
  };

  const serverValues: Record<keyof RegistrationDraft, string> = {
    ...server,
    seat_type: serverSeat,
    session_ids: tr("messagesChosen", {
      count: serverSessionIds.length,
      total: sessionsCount,
    }),
    locality: serverLocality,
    site_id: serverSite,
    group_language: langLabel(server.group_language),
    outline_language: langLabel(server.outline_language),
    second_outline_language: langLabel(server.second_outline_language),
  };

  return { fieldLabels, serverValues };
}

function AboutYouFields(props: {
  seatType: SeatType;
  draft: RegistrationDraft;
  localities: readonly LocalityOption[];
  sites: readonly SiteOption[];
  onEdit: EditDraftField;
  onLocalityChange: (next: string) => void;
}) {
  const tr = useTranslations("register");
  const { draft, onEdit } = props;
  return (
    <FormSection legend={tr("sectionAboutYou")}>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <FormField label={tr("firstName")} required>
          <Input
            name="first_name"
            autoComplete="given-name"
            value={draft.first_name}
            onChange={(e) => onEdit("first_name", e.currentTarget.value)}
          />
        </FormField>
        <FormField label={tr("lastName")} required>
          <Input
            name="last_name"
            autoComplete="family-name"
            value={draft.last_name}
            onChange={(e) => onEdit("last_name", e.currentTarget.value)}
          />
        </FormField>
        {props.seatType === "shared" && (
          <>
            <FormField label={tr("partnerFirstName")} required>
              <Input
                name="partner_first_name"
                autoComplete="off"
                value={draft.partner_first_name}
                onChange={(e) => onEdit("partner_first_name", e.currentTarget.value)}
              />
            </FormField>
            <FormField label={tr("partnerLastName")} required>
              <Input
                name="partner_last_name"
                autoComplete="off"
                value={draft.partner_last_name}
                onChange={(e) => onEdit("partner_last_name", e.currentTarget.value)}
              />
            </FormField>
          </>
        )}
        <FormField label={tr("email")} required>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={draft.email}
            onChange={(e) => onEdit("email", e.currentTarget.value)}
          />
        </FormField>
        <FormField label={tr("phone")} optionalLabel={tr("optional")}>
          <Input
            name="phone"
            type="tel"
            autoComplete="tel"
            value={draft.phone}
            onChange={(e) => onEdit("phone", e.currentTarget.value)}
          />
        </FormField>
        <SelectField
          label={tr("locality")}
          required
          field={{
            name: "locality",
            value: draft.locality,
            onChange: (e) => props.onLocalityChange(e.currentTarget.value),
          }}
        >
          <option value="" disabled>
            {tr("choose")}
          </option>
          {props.localities.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
          <option value="other">{tr("otherLocality")}</option>
        </SelectField>
        {props.sites.length > 1 && (
          <SelectField
            label={tr("site")}
            required
            field={{
              name: "site_id",
              value: draft.site_id,
              onChange: (e) => onEdit("site_id", e.currentTarget.value),
            }}
          >
            <option value="" disabled>
              {tr("choose")}
            </option>
            {props.sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        )}
        {draft.locality === "other" && (
          <FormField label={tr("otherLocalityLabel")} required>
            <Input
              name="other_locality"
              autoComplete="address-level2"
              maxLength={100}
              value={draft.other_locality}
              onChange={(e) => onEdit("other_locality", e.currentTarget.value)}
            />
          </FormField>
        )}
      </SimpleGrid>
      {props.sites.length === 1 && <input type="hidden" name="site_id" value={draft.site_id} />}
    </FormSection>
  );
}

function LanguagesFields(props: {
  seatType: SeatType;
  draft: RegistrationDraft;
  onEdit: EditDraftField;
  onOutlineChange: (next: string) => void;
}) {
  const tr = useTranslations("register");
  const tl = useTranslations("common.languages");
  const { draft, onEdit } = props;
  const needsOutline = props.seatType !== "anaheim";
  const options = (list: readonly Language[]) =>
    list.map((l) => (
      <option key={l} value={l}>
        {tl(l)}
      </option>
    ));

  return (
    <FormSection legend={tr("sectionLanguages")}>
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap="4">
        <SelectField
          label={tr("groupLanguage")}
          field={{
            name: "group_language",
            value: draft.group_language,
            onChange: (e) => onEdit("group_language", e.currentTarget.value),
          }}
        >
          {options(languages)}
        </SelectField>
        {needsOutline && (
          <>
            <SelectField
              label={tr("outlineLanguage")}
              field={{
                name: "outline_language",
                value: draft.outline_language,
                onChange: (e) => props.onOutlineChange(e.currentTarget.value),
              }}
            >
              {options(languages)}
            </SelectField>
            <SelectField
              label={tr("secondOutlineLanguage")}
              field={{
                name: "second_outline_language",
                value: draft.second_outline_language,
                onChange: (e) => onEdit("second_outline_language", e.currentTarget.value),
              }}
            >
              <option value="">{tr("none")}</option>
              {options(languages.filter((l) => l !== draft.outline_language))}
            </SelectField>
          </>
        )}
      </SimpleGrid>
      {needsOutline && <Text fontWeight="medium">{tr("outlinesRule")}</Text>}
      <FormField label={tr("comments")} optionalLabel={tr("optional")}>
        <Textarea
          name="comments"
          rows={3}
          value={draft.comments}
          onChange={(e) => onEdit("comments", e.currentTarget.value)}
        />
      </FormField>
    </FormSection>
  );
}

// Collaborative registration editor for coordinators: shares the underlying
// 3-way draft sync and conflict resolution used across coordination forms.
export function CoordinatorRegistrationForm(props: {
  sessions: SessionOption[];
  localities: LocalityOption[];
  sites: SiteOption[];
  feeCents: number;
  defaults: RegistrationDefaults;
  version: string;
  action: FormAction;
}) {
  const locale = useLocale();
  const tr = useTranslations("register");
  const tl = useTranslations("common.languages");
  const tc = useTranslations("coordinator");
  const [sessionsMissing, setSessionsMissing] = useState(false);

  const server = toRegistrationDraft(props.defaults, props.sites);
  const collab = useCollaborativeForm({
    server,
    version: props.version,
    action: props.action,
  });

  const seatType: SeatType = isSeatType(collab.draft.seat_type)
    ? collab.draft.seat_type
    : props.defaults.seat_type;
  const chosenSessions = new Set(splitSessionIds(collab.draft.session_ids));

  function onSeatTypeChange(next: SeatType) {
    collab.edit("seat_type", next);
    if (!picksSessions(next)) {
      collab.edit("session_ids", "");
      setSessionsMissing(false);
    }
    if (next !== "shared") {
      collab.edit("partner_first_name", "");
      collab.edit("partner_last_name", "");
    }
    if (next === "anaheim") {
      collab.edit("outline_language", "");
      collab.edit("second_outline_language", "");
    } else if (!collab.draft.outline_language) {
      collab.edit(
        "outline_language",
        isLanguage(collab.draft.group_language) ? collab.draft.group_language : "de",
      );
    }
  }

  function onSessionToggle(sessionId: string, checked: boolean) {
    const next = new Set(chosenSessions);
    if (checked) next.add(sessionId);
    else next.delete(sessionId);
    collab.edit("session_ids", joinSessionIds([...next]));
    if (next.size > 0) setSessionsMissing(false);
  }

  function onLocalityChange(next: string) {
    collab.edit("locality", next);
    if (next !== "other" && collab.draft.other_locality !== "") {
      collab.edit("other_locality", "");
    }
  }

  function onOutlineChange(next: string) {
    collab.edit("outline_language", next);
    if (next === collab.draft.second_outline_language) {
      collab.edit("second_outline_language", "");
    }
  }

  function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    if (seatType === "part_time" && chosenSessions.size === 0) {
      e.preventDefault();
      setSessionsMissing(true);
      e.currentTarget.querySelector<HTMLInputElement>('input[name="session_ids"]')?.focus();
      return;
    }
    setSessionsMissing(false);
    collab.submit(e);
  }

  const { fieldLabels, serverValues } = buildConflictMetadata({
    server,
    sessionsCount: props.sessions.length,
    localities: props.localities,
    sites: props.sites,
    tr,
    tl,
  });

  function seatHelp(s: SeatType) {
    if (s === "shared") return tr("seatHelp.shared");
    if (s === "anaheim") return tr("seatHelp.anaheim");
    return undefined;
  }

  return (
    <chakra.form onSubmit={onSubmit} display="flex" flexDirection="column" gap="10">
      <FormSection legend={tr("seatType")}>
        <Text mb="2">{tr("seatRules", { fee: formatEuro(props.feeCents, locale) })}</Text>
        <RadioChoices
          name="seat_type"
          value={seatType}
          onChange={onSeatTypeChange}
          options={seatTypes.map((s) => ({
            value: s,
            label: tr(`seat.${s}`),
            description: seatHelp(s),
          }))}
        />
      </FormSection>

      {picksSessions(seatType) && (
        <FormSection legend={tr("sessions")}>
          <Text mb="2">
            {seatType === "anaheim" ? tr("sessionsAnaheimHint") : tr("sessionsPartHint")}
          </Text>
          {sessionsMissing && (
            <Text id="sessions-error" mb="2" fontWeight="semibold" color="fg.error">
              {tr("sessionsRequired")}
            </Text>
          )}
          <SimpleGrid columns={{ base: 1, sm: 2 }} columnGap="6">
            {props.sessions.map((s) => (
              <CheckboxChoice
                key={s.id}
                name="session_ids"
                value={s.id}
                checked={chosenSessions.has(s.id)}
                invalid={sessionsMissing}
                describedBy={sessionsMissing ? "sessions-error" : undefined}
                onCheckedChange={(checked) => onSessionToggle(s.id, checked)}
              >
                <Span fontVariantNumeric="tabular-nums">{s.label}</Span>
              </CheckboxChoice>
            ))}
          </SimpleGrid>
        </FormSection>
      )}

      <AboutYouFields
        seatType={seatType}
        draft={collab.draft}
        localities={props.localities}
        sites={props.sites}
        onEdit={collab.edit}
        onLocalityChange={onLocalityChange}
      />

      <LanguagesFields
        seatType={seatType}
        draft={collab.draft}
        onEdit={collab.edit}
        onOutlineChange={onOutlineChange}
      />

      <ConfirmRules confirmed />

      <ConflictBanner
        {...collab.bannerProps}
        fieldLabels={fieldLabels}
        serverValues={serverValues}
      />
      <Button type="submit" size="lg" alignSelf="flex-start" px="6" loading={collab.pending}>
        {tc("saveChanges")}
      </Button>
      <FormResult state={collab.result} saved={tc("saved")} focus errorTone="warning" />
    </chakra.form>
  );
}
