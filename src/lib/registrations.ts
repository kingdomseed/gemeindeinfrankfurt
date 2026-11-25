import "server-only";
import { checkBotId } from "botid/server";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import type { ActionState, CancelState } from "@/features/registration/types";
import type { CoordinatorClient } from "@/lib/auth";
import { calendarUrl as defaultCalendarUrl } from "@/lib/calendar";
import {
  getPublishedTraining,
  getTrainingById,
  type Training,
  type TrainingWithSessions,
} from "@/lib/data";
import { berlinDayKey } from "@/lib/domain/berlin-time";
import { canCancel, canChangeSeatOrSessions, canRegister } from "@/lib/domain/cutoffs";
import { resolveLocalityInput } from "@/lib/domain/locality";
import { planPaymentUpdate } from "@/lib/domain/payments";
import { hashToken, newEditToken } from "@/lib/domain/token";
import {
  picksSessions,
  type AssignableFeeWaiver,
  type FeeWaiver,
  type Language,
  type SeatType,
} from "@/lib/domain/types";
import type { ConfirmationRegistration } from "@/lib/email/compose";
import { confirmationFromInput, sendCancellation, sendConfirmation } from "@/lib/email/send";
import { placeInStudyGroup } from "@/lib/groups";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

const language = z.enum(["de", "en", "ru"]);
const seatType = z.enum(["full_time", "part_time", "shared", "anaheim"]);

export const registrationSchema = z
  .object({
    seat_type: seatType,
    session_ids: z.array(z.uuid()).default([]),
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    partner_first_name: z.string().trim().max(100).optional(),
    partner_last_name: z.string().trim().max(100).optional(),
    email: z.email().max(200),
    phone: z.string().trim().max(50).default(""),
    locality_id: z.uuid().nullable(),
    other_locality: z.string().trim().max(100).default(""),
    site_id: z.uuid().nullable(),
    group_language: language,
    outline_language: language.nullable(),
    second_outline_language: language.nullable(),
    comments: z.string().trim().max(2000).default(""),
    confirmed_adult: z.literal(true),
    accepted_rules: z.literal(true),
  })
  .refine((r) => r.seat_type !== "shared" || (r.partner_first_name && r.partner_last_name), {
    path: ["partner_first_name"],
  })
  .refine((r) => r.seat_type !== "part_time" || r.session_ids.length > 0, {
    path: ["session_ids"],
  })
  // Either a curated locality is picked or "Other" is typed, never both.
  .refine((r) => r.locality_id === null || r.other_locality === "", {
    path: ["other_locality"],
  })
  .refine((r) => (r.locality_id !== null) !== r.other_locality.length > 0, {
    path: ["locality_id"],
  })
  // Anaheim attendees already have their outlines; everyone else orders one.
  .refine((r) => (r.seat_type === "anaheim") === (r.outline_language === null), {
    path: ["outline_language"],
  })
  .refine(
    (r) =>
      r.second_outline_language === null ||
      (r.outline_language !== null && r.second_outline_language !== r.outline_language),
    { path: ["second_outline_language"] },
  );

export type RegistrationInput = z.infer<typeof registrationSchema>;

export type LockedSeat = {
  seat_type: SeatType;
  session_ids: readonly string[];
  partner_first_name: string | null;
  partner_last_name: string | null;
};

export function parseRegistrationForm(form: FormData, lockedSeat?: LockedSeat) {
  const text = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : undefined;
  };
  const seat = lockedSeat ? lockedSeat.seat_type : seatType.safeParse(text("seat_type")).data;
  const anaheim = seat === "anaheim";
  const rawLocality = text("locality");
  const isOtherLocality = rawLocality === "other";

  let sessionIds: unknown[] = [];
  if (lockedSeat) {
    sessionIds = picksSessions(lockedSeat.seat_type) ? [...lockedSeat.session_ids] : [];
  } else if (seat && picksSessions(seat)) {
    sessionIds = form.getAll("session_ids");
  }

  let partnerFirstName: string | undefined;
  let partnerLastName: string | undefined;
  if (seat === "shared") {
    partnerFirstName = lockedSeat
      ? (lockedSeat.partner_first_name ?? undefined)
      : text("partner_first_name");
    partnerLastName = lockedSeat
      ? (lockedSeat.partner_last_name ?? undefined)
      : text("partner_last_name");
  }

  return registrationSchema.safeParse({
    seat_type: seat,
    session_ids: sessionIds,
    first_name: text("first_name"),
    last_name: text("last_name"),
    partner_first_name: partnerFirstName,
    partner_last_name: partnerLastName,
    email: text("email")?.trim().toLowerCase(),
    phone: text("phone"),
    locality_id: isOtherLocality ? null : rawLocality || null,
    other_locality: isOtherLocality ? (text("other_locality") ?? "") : "",
    site_id: text("site_id") || null,
    group_language: text("group_language"),
    outline_language: anaheim ? null : text("outline_language"),
    second_outline_language: anaheim ? null : text("second_outline_language") || null,
    comments: text("comments"),
    confirmed_adult: form.get("confirmed_adult") === "on",
    accepted_rules: form.get("accepted_rules") === "on",
  });
}

// Checks submitted sessions, locality and attendance site against the training's
// own options, normalizing an "Other" entry that matches a listed city.
export function validateForTraining(
  input: RegistrationInput,
  training: TrainingWithSessions,
): RegistrationInput | null {
  const allowedSessions = new Set(training.sessions.map((s) => s.id));
  if (!input.session_ids.every((id) => allowedSessions.has(id))) return null;

  const locality = resolveLocalityInput(
    input.locality_id,
    input.other_locality,
    training.localities,
  );
  if (!locality) return null;

  const siteOk =
    input.site_id !== null
      ? training.sites.some((s) => s.id === input.site_id)
      : training.sites.length === 0;
  if (!siteOk) return null;

  return {
    ...input,
    ...locality,
    session_ids: picksSessions(input.seat_type) ? [...new Set(input.session_ids)] : [],
  };
}

const day = z.union([z.iso.date(), z.literal("").transform(() => null)]);
const mark = {
  paid: z.literal("on").optional(),
  paidOn: day,
  transaction: z.string().trim().max(100),
};
const paymentSchema = z.object({
  fee_paid: mark.paid,
  fee_paid_on: day.default(null),
  fee_transaction: mark.transaction.default(""),
  outline_paid: mark.paid,
  outline_paid_on: day.default(null),
  outline_transaction: mark.transaction.default(""),
  waiver: z.union([z.enum(["hardship", "anaheim"]), z.literal("").transform(() => null)]),
  waiver_reason: z.string().trim().max(500),
  version: z.string().min(1),
});

export type PaymentFormInput = z.infer<typeof paymentSchema>;

export function parsePaymentForm(form: FormData) {
  return paymentSchema.safeParse(Object.fromEntries(form));
}

export async function findByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const { data, error } = await createAdminClient()
    .from("registrations")
    .select("*, registration_sessions(session_id)")
    .eq("edit_token_hash", hashToken(token))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function hasPossibleDuplicate(trainingId: string, r: RegistrationInput) {
  const { count, error } = await createAdminClient()
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("training_id", trainingId)
    .eq("status", "active")
    .ilike("email", r.email)
    .ilike("first_name", r.first_name)
    .ilike("last_name", r.last_name);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export type StoredRegistrationRecord = {
  id: string;
  training_id: string;
  status: "active" | "cancelled";
  seat_type: SeatType;
  first_name: string;
  last_name: string;
  partner_first_name: string | null;
  partner_last_name: string | null;
  email: string;
  locale: Language;
  group_language: Language;
  outline_language: Language | null;
  second_outline_language: Language | null;
  locality_id: string | null;
  other_locality: string;
  site_id: string | null;
  waiver: FeeWaiver | null;
  waiver_reason: string;
  fee_paid: boolean;
  fee_paid_on: string | null;
  fee_transaction: string;
  outline_paid: boolean;
  outline_paid_on: string | null;
  outline_transaction: string;
  updated_at: string;
  registration_sessions: { session_id: string }[];
};

export type SaveRegistrationResult = "saved" | "stale" | "not_found";
export type CancelRegistrationResult = "cancelled" | "not_found";
export type SavePaymentResult = "saved" | "stale" | "not_found";

export type RegistrationStore<TClient = CoordinatorClient> = {
  getPublishedTraining: () => Promise<TrainingWithSessions | null>;
  getTrainingById: (trainingId: string) => Promise<TrainingWithSessions>;
  findByToken: (token: string) => Promise<StoredRegistrationRecord | null>;
  findForCoordinator: (client: TClient, id: string) => Promise<StoredRegistrationRecord | null>;
  hasPossibleDuplicate: (trainingId: string, input: RegistrationInput) => Promise<boolean>;
  createRegistration: (args: {
    trainingId: string;
    locale: Language;
    editTokenHash: string;
    input: RegistrationInput;
  }) => Promise<string>;
  placeInStudyGroup: (args: {
    id: string;
    trainingId: string;
    language: Language;
  }) => Promise<void>;
  saveRegistration: (args: {
    client?: TClient;
    id: string;
    expectedUpdatedAt: string | null;
    locale: Language | null;
    input: RegistrationInput;
    replaceSessions: boolean;
  }) => Promise<SaveRegistrationResult>;
  cancelRegistration: (args: { client?: TClient; id: string }) => Promise<CancelRegistrationResult>;
  savePayment: (args: {
    client: TClient;
    id: string;
    expectedUpdatedAt: string;
    plan: {
      fee: { paid: boolean; paidOn: string | null; transaction: string } | null;
      outline: { paid: boolean; paidOn: string | null; transaction: string } | null;
      waiver: AssignableFeeWaiver | null;
      waiverReason: string;
      events: readonly string[];
    };
  }) => Promise<SavePaymentResult>;
  replaceEditToken: (args: {
    client: TClient;
    registrationId: string;
    editTokenHash: string;
    actorName: string;
  }) => Promise<void>;
};

export type RegistrationLifecycleDeps<TClient = CoordinatorClient> = {
  checkBot: () => Promise<{ isBot: boolean }>;
  now: () => Date;
  newToken: () => { token: string; hash: string };
  calendarUrl: (locale: Language, token: string) => string;
  mail: {
    sendConfirmation: (opts: {
      locale: Language;
      training: TrainingWithSessions;
      registration: ConfirmationRegistration;
      registrationId: string;
      token: string;
    }) => Promise<void>;
    sendCancellation: (opts: {
      locale: Language;
      training: Training;
      registrationId: string;
      email: string;
      firstName: string;
    }) => Promise<void>;
  };
  onGroupPlaceError: (error: unknown) => void;
  store: RegistrationStore<TClient>;
};

const saveResultSchema = z.enum(["saved", "stale", "not_found"]);
const cancelResultSchema = z.enum(["cancelled", "not_found"]);
const paymentResultSchema = z.enum(["saved", "stale", "not_found"]);
const uuidSchema = z.uuid();

function rpcSaveRegistrationArgs(args: {
  id: string;
  expectedUpdatedAt: string | null;
  locale: Language | null;
  input: RegistrationInput;
  replaceSessions: boolean;
}): Database["public"]["Functions"]["save_registration"]["Args"] {
  const { input } = args;
  const shared = input.seat_type === "shared";
  const partnerFirstName = shared ? (input.partner_first_name ?? null) : null;
  const partnerLastName = shared ? (input.partner_last_name ?? null) : null;
  return {
    p_id: args.id,
    p_seat_type: input.seat_type,
    p_first_name: input.first_name,
    p_last_name: input.last_name,
    p_email: input.email,
    p_phone: input.phone,
    p_other_locality: input.other_locality,
    p_group_language: input.group_language,
    p_comments: input.comments,
    p_confirmed_adult: input.confirmed_adult,
    p_accepted_rules: input.accepted_rules,
    p_replace_sessions: args.replaceSessions,
    p_session_ids: input.session_ids,
    ...(args.expectedUpdatedAt !== null ? { p_expected_updated_at: args.expectedUpdatedAt } : {}),
    ...(args.locale !== null ? { p_locale: args.locale } : {}),
    ...(partnerFirstName !== null ? { p_partner_first_name: partnerFirstName } : {}),
    ...(partnerLastName !== null ? { p_partner_last_name: partnerLastName } : {}),
    ...(input.locality_id !== null ? { p_locality_id: input.locality_id } : {}),
    ...(input.site_id !== null ? { p_site_id: input.site_id } : {}),
    ...(input.outline_language !== null ? { p_outline_language: input.outline_language } : {}),
    ...(input.second_outline_language !== null
      ? { p_second_outline_language: input.second_outline_language }
      : {}),
  };
}

function createSupabaseStore(): RegistrationStore {
  return {
    getPublishedTraining,
    getTrainingById,
    findByToken,
    async findForCoordinator(supabase, id) {
      const { data, error } = await supabase
        .from("registrations")
        .select(
          "id, training_id, status, seat_type, first_name, last_name, partner_first_name, partner_last_name, email, locale, group_language, outline_language, second_outline_language, locality_id, other_locality, site_id, waiver, waiver_reason, fee_paid, fee_paid_on, fee_transaction, outline_paid, outline_paid_on, outline_transaction, updated_at, registration_sessions(session_id)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    hasPossibleDuplicate,
    async createRegistration({ trainingId, locale, editTokenHash, input }) {
      const shared = input.seat_type === "shared";
      const partnerFirstName = shared ? (input.partner_first_name ?? null) : null;
      const partnerLastName = shared ? (input.partner_last_name ?? null) : null;
      const { data, error } = await createAdminClient().rpc("create_registration", {
        p_training_id: trainingId,
        p_locale: locale,
        p_edit_token_hash: editTokenHash,
        p_seat_type: input.seat_type,
        p_first_name: input.first_name,
        p_last_name: input.last_name,
        p_email: input.email,
        p_phone: input.phone,
        p_other_locality: input.other_locality,
        p_group_language: input.group_language,
        p_comments: input.comments,
        p_confirmed_adult: input.confirmed_adult,
        p_accepted_rules: input.accepted_rules,
        p_session_ids: input.session_ids,
        ...(partnerFirstName !== null ? { p_partner_first_name: partnerFirstName } : {}),
        ...(partnerLastName !== null ? { p_partner_last_name: partnerLastName } : {}),
        ...(input.locality_id !== null ? { p_locality_id: input.locality_id } : {}),
        ...(input.site_id !== null ? { p_site_id: input.site_id } : {}),
        ...(input.outline_language !== null ? { p_outline_language: input.outline_language } : {}),
        ...(input.second_outline_language !== null
          ? { p_second_outline_language: input.second_outline_language }
          : {}),
      });
      if (error) throw error;
      return uuidSchema.parse(data);
    },
    placeInStudyGroup,
    async saveRegistration(args) {
      const db = args.client ?? createAdminClient();
      const { data, error } = await db.rpc("save_registration", rpcSaveRegistrationArgs(args));
      if (error) throw error;
      return saveResultSchema.parse(data);
    },
    async cancelRegistration({ client, id }) {
      const db = client ?? createAdminClient();
      const { data, error } = await db.rpc("cancel_registration", { p_id: id });
      if (error) throw error;
      return cancelResultSchema.parse(data);
    },
    async savePayment({ client, id, expectedUpdatedAt, plan }) {
      const { data, error } = await client.rpc("save_registration_payment", {
        p_id: id,
        p_expected_updated_at: expectedUpdatedAt,
        p_update_fee: plan.fee !== null,
        p_fee_paid: plan.fee?.paid ?? false,
        p_fee_transaction: plan.fee?.transaction ?? "",
        p_update_outline: plan.outline !== null,
        p_outline_paid: plan.outline?.paid ?? false,
        p_outline_transaction: plan.outline?.transaction ?? "",
        p_waiver_reason: plan.waiverReason,
        p_events: [...plan.events],
        ...(plan.fee?.paidOn != null ? { p_fee_paid_on: plan.fee.paidOn } : {}),
        ...(plan.outline?.paidOn != null ? { p_outline_paid_on: plan.outline.paidOn } : {}),
        ...(plan.waiver !== null ? { p_waiver: plan.waiver } : {}),
      });
      if (error) throw error;
      return paymentResultSchema.parse(data);
    },
    async replaceEditToken({ client, registrationId, editTokenHash, actorName }) {
      const { error: updateError } = await client
        .from("registrations")
        .update({ edit_token_hash: editTokenHash })
        .eq("id", registrationId);
      if (updateError) throw updateError;
      const { error: eventError } = await client.from("registration_events").insert({
        registration_id: registrationId,
        kind: "link_sent",
        actor_name: actorName,
      });
      if (eventError) throw eventError;
    },
  };
}

function readVersion(form: FormData): string | null {
  const value = form.get("version");
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function createRegistrationLifecycle<TClient = CoordinatorClient>(
  deps: RegistrationLifecycleDeps<TClient>,
) {
  const { store, mail } = deps;

  return {
    async registerPublic(locale: Language, form: FormData): Promise<ActionState> {
      const verification = await deps.checkBot();
      if (verification.isBot) return { status: "error" };

      const training = await store.getPublishedTraining();
      if (!training || !canRegister(training.sessions, deps.now())) return { status: "closed" };

      const parsed = parseRegistrationForm(form);
      if (!parsed.success) return { status: "error" };
      const input = validateForTraining(parsed.data, training);
      if (!input) return { status: "error" };

      if (form.get("confirm_duplicate") !== "on") {
        const duplicate = await store.hasPossibleDuplicate(training.id, input);
        if (duplicate) return { status: "duplicate" };
      }

      const { token, hash } = deps.newToken();
      const registrationId = await store.createRegistration({
        trainingId: training.id,
        locale,
        editTokenHash: hash,
        input,
      });

      // A missing group place is fixed by hand on the groups page; it must not
      // stop the registration.
      await store
        .placeInStudyGroup({
          id: registrationId,
          trainingId: training.id,
          language: input.group_language,
        })
        .catch(deps.onGroupPlaceError);

      await mail.sendConfirmation({
        locale,
        training,
        registration: confirmationFromInput(input, false),
        registrationId,
        token,
      });
      return { status: "done", calendarUrl: deps.calendarUrl(locale, token) };
    },

    async updateByToken(token: string, locale: Language, form: FormData): Promise<ActionState> {
      const existing = await store.findByToken(token);
      if (!existing || existing.status === "cancelled") return { status: "error" };

      const version = readVersion(form);
      if (!version) return { status: "error" };

      const training = await store.getTrainingById(existing.training_id);
      const seatLocked = !canChangeSeatOrSessions(training.sessions, deps.now());
      const lockedSeat: LockedSeat | undefined = seatLocked
        ? {
            seat_type: existing.seat_type,
            session_ids: existing.registration_sessions.map((s) => s.session_id),
            partner_first_name: existing.partner_first_name,
            partner_last_name: existing.partner_last_name,
          }
        : undefined;

      const parsed = parseRegistrationForm(form, lockedSeat);
      if (!parsed.success) return { status: "error" };
      const input = validateForTraining(parsed.data, training);
      if (!input) return { status: "error" };

      const result = await store.saveRegistration({
        id: existing.id,
        expectedUpdatedAt: version,
        locale,
        input,
        replaceSessions: !seatLocked,
      });
      if (result === "not_found") return { status: "error" };
      if (result === "stale") return { status: "stale" };

      await mail.sendConfirmation({
        locale,
        training,
        registration: confirmationFromInput(input, existing.waiver !== null),
        registrationId: existing.id,
        token,
      });
      return { status: "saved" };
    },

    async cancelByToken(token: string, locale: Language): Promise<CancelState> {
      const existing = await store.findByToken(token);
      if (!existing || existing.status === "cancelled") return { status: "error" };
      const training = await store.getTrainingById(existing.training_id);
      if (!canCancel(training.sessions, deps.now())) return { status: "locked" };

      const result = await store.cancelRegistration({ id: existing.id });
      if (result !== "cancelled") return { status: "error" };

      await mail.sendCancellation({
        locale,
        training,
        registrationId: existing.id,
        email: existing.email,
        firstName: existing.first_name,
      });
      return { status: "cancelled" };
    },

    async coordinatorUpdateRegistration(
      client: TClient,
      registrationId: string,
      form: FormData,
    ): Promise<FormState> {
      const existing = await store.findForCoordinator(client, registrationId);
      if (!existing || existing.status === "cancelled") return { status: "error" };

      const version = readVersion(form);
      if (!version) return { status: "error" };

      const parsed = parseRegistrationForm(form);
      if (!parsed.success) return { status: "error" };
      const training = await store.getTrainingById(existing.training_id);
      const input = validateForTraining(parsed.data, training);
      if (!input) return { status: "error" };

      const result = await store.saveRegistration({
        client,
        id: registrationId,
        expectedUpdatedAt: version,
        locale: null,
        input,
        replaceSessions: true,
      });
      if (result === "not_found") return { status: "error" };
      if (result === "stale") return { status: "stale" };
      return { status: "saved" };
    },

    async coordinatorCancelRegistration(
      client: TClient,
      registrationId: string,
    ): Promise<CancelState> {
      const existing = await store.findForCoordinator(client, registrationId);
      if (!existing || existing.status === "cancelled") return { status: "error" };

      const result = await store.cancelRegistration({ client, id: registrationId });
      if (result !== "cancelled") return { status: "error" };

      await mail.sendCancellation({
        locale: existing.locale,
        training: await store.getTrainingById(existing.training_id),
        registrationId,
        email: existing.email,
        firstName: existing.first_name,
      });
      return { status: "cancelled" };
    },

    async coordinatorSavePayment(
      client: TClient,
      registrationId: string,
      form: FormData,
    ): Promise<FormState> {
      const parsed = parsePaymentForm(form);
      if (!parsed.success) return { status: "error" };
      const input = parsed.data;

      const existing = await store.findForCoordinator(client, registrationId);
      if (!existing || existing.status === "cancelled" || existing.seat_type === "anaheim") {
        return { status: "error" };
      }

      const plan = planPaymentUpdate(
        existing,
        {
          fee: {
            paid: input.fee_paid === "on",
            paidOn: input.fee_paid_on,
            transaction: input.fee_transaction,
          },
          outline: {
            paid: input.outline_paid === "on",
            paidOn: input.outline_paid_on,
            transaction: input.outline_transaction,
          },
          waiver: input.waiver,
          waiverReason: input.waiver_reason,
        },
        berlinDayKey(deps.now()),
      );

      const result = await store.savePayment({
        client,
        id: registrationId,
        expectedUpdatedAt: input.version,
        plan,
      });
      if (result === "not_found") return { status: "error" };
      if (result === "stale") return { status: "stale" };
      return { status: "saved" };
    },

    async coordinatorSendEditLink(
      client: TClient,
      actorName: string,
      registrationId: string,
    ): Promise<FormState> {
      const existing = await store.findForCoordinator(client, registrationId);
      if (!existing || existing.status === "cancelled") return { status: "error" };

      // The email goes first: if it fails, the old link keeps working.
      const { token, hash } = deps.newToken();
      await mail.sendConfirmation({
        locale: existing.locale,
        training: await store.getTrainingById(existing.training_id),
        registration: {
          firstName: existing.first_name,
          email: existing.email,
          seatType: existing.seat_type,
          localityId: existing.locality_id,
          otherLocality: existing.other_locality,
          siteId: existing.site_id,
          groupLanguage: existing.group_language,
          outlineLanguage: existing.outline_language,
          secondOutlineLanguage: existing.second_outline_language,
          sessionIds: existing.registration_sessions.map((s) => s.session_id),
          waived: existing.waiver !== null,
        },
        registrationId,
        token,
      });
      await store.replaceEditToken({
        client,
        registrationId,
        editTokenHash: hash,
        actorName,
      });
      return { status: "saved" };
    },
  };
}

let defaultLifecycle: ReturnType<typeof createRegistrationLifecycle<CoordinatorClient>> | null =
  null;

function lifecycle() {
  defaultLifecycle ??= createRegistrationLifecycle({
    checkBot: checkBotId,
    now: () => new Date(),
    newToken: newEditToken,
    calendarUrl: defaultCalendarUrl,
    mail: { sendConfirmation, sendCancellation },
    onGroupPlaceError: (placeError) => {
      console.error("Could not place the registration in a study group", placeError);
    },
    store: createSupabaseStore(),
  });
  return defaultLifecycle;
}

export function registerPublic(locale: Language, form: FormData): Promise<ActionState> {
  return lifecycle().registerPublic(locale, form);
}

export function updateByToken(
  token: string,
  locale: Language,
  form: FormData,
): Promise<ActionState> {
  return lifecycle().updateByToken(token, locale, form);
}

export function cancelByToken(token: string, locale: Language): Promise<CancelState> {
  return lifecycle().cancelByToken(token, locale);
}

export function coordinatorUpdateRegistration(
  supabase: CoordinatorClient,
  registrationId: string,
  form: FormData,
): Promise<FormState> {
  return lifecycle().coordinatorUpdateRegistration(supabase, registrationId, form);
}

export function coordinatorCancelRegistration(
  supabase: CoordinatorClient,
  registrationId: string,
): Promise<CancelState> {
  return lifecycle().coordinatorCancelRegistration(supabase, registrationId);
}

export function coordinatorSavePayment(
  supabase: CoordinatorClient,
  registrationId: string,
  form: FormData,
): Promise<FormState> {
  return lifecycle().coordinatorSavePayment(supabase, registrationId, form);
}

export function coordinatorSendEditLink(
  supabase: CoordinatorClient,
  actorName: string,
  registrationId: string,
): Promise<FormState> {
  return lifecycle().coordinatorSendEditLink(supabase, actorName, registrationId);
}
