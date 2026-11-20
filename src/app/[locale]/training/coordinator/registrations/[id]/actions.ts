"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { recordEvents, type EventKind } from "@/lib/coordinator";
import { getTrainingById } from "@/lib/data";
import { settledMark } from "@/lib/domain/payments";
import { newEditToken } from "@/lib/domain/token";
import { sendCancellation, sendConfirmation } from "@/lib/email/send";
import {
  parseRegistrationForm,
  registrationSchema,
  replaceSessions,
  toRow,
} from "@/lib/registrations";

type State = { status: "idle" | "saved" | "error" | "stale" };

const id = z.uuid();
const day = z.union([z.iso.date(), z.literal("").transform(() => null)]);
const mark = {
  paid: z.literal("on").optional(),
  paidOn: day,
  transaction: z.string().trim().max(100),
};
const payment = z.object({
  fee_paid: mark.paid,
  fee_paid_on: day.default(null),
  fee_transaction: mark.transaction.default(""),
  outline_paid: mark.paid,
  outline_paid_on: day.default(null),
  outline_transaction: mark.transaction.default(""),
  waiver: z.union([z.enum(["hardship", "anaheim"]), z.literal("").transform(() => null)]),
  waiver_reason: z.string().trim().max(500),
  // The row's updated_at as the form was rendered.
  version: z.string().min(1),
});

// en-CA writes a date as YYYY-MM-DD.
const berlinDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" });

// Marks the donation and the outlines as received (or not) and sets the waiver.
// Only the payments the form showed are touched: a waived donation and a seat
// without outlines keep what they had. A form rendered before someone else's
// change is refused, so it cannot undo that change.
export async function savePayment(rawId: string, _prev: State, form: FormData): Promise<State> {
  const supabase = await requireAuth();
  const registrationId = id.parse(rawId);
  const parsed = payment.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const input = parsed.data;

  const { data: existing, error: readError } = await supabase
    .from("registrations")
    .select(
      "status, seat_type, waiver, waiver_reason, outline_language, fee_paid, fee_paid_on, fee_transaction, outline_paid, outline_paid_on, outline_transaction",
    )
    .eq("id", registrationId)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing || existing.status === "cancelled" || existing.seat_type === "anaheim") {
    return { status: "error" };
  }

  const today = berlinDay.format(new Date());
  const events: EventKind[] = [];
  const fee =
    existing.waiver === null
      ? settledMark(
          {
            paid: input.fee_paid === "on",
            paidOn: input.fee_paid_on,
            transaction: input.fee_transaction,
          },
          today,
        )
      : null;
  const outline =
    existing.outline_language === null
      ? null
      : settledMark(
          {
            paid: input.outline_paid === "on",
            paidOn: input.outline_paid_on,
            transaction: input.outline_transaction,
          },
          today,
        );
  if (fee && fee.paid !== existing.fee_paid) {
    events.push(fee.paid ? "fee_received" : "fee_unmarked");
  }
  if (outline && outline.paid !== existing.outline_paid) {
    events.push(outline.paid ? "outline_received" : "outline_unmarked");
  }
  if ((input.waiver === null) !== (existing.waiver === null)) {
    events.push(input.waiver === null ? "waiver_removed" : "waiver_set");
  }
  // A corrected date, transaction number or waiver reason, with the marks as they were.
  const feeCorrected =
    fee?.paid === existing.fee_paid &&
    (fee.paidOn !== existing.fee_paid_on || fee.transaction !== existing.fee_transaction);
  const outlineCorrected =
    outline?.paid === existing.outline_paid &&
    (outline.paidOn !== existing.outline_paid_on ||
      outline.transaction !== existing.outline_transaction);
  const reasonCorrected =
    input.waiver !== null &&
    existing.waiver !== null &&
    input.waiver_reason !== existing.waiver_reason;
  if (feeCorrected || outlineCorrected || reasonCorrected) events.push("payment_edited");

  const { data: updated, error } = await supabase
    .from("registrations")
    .update({
      ...(fee && {
        fee_paid: fee.paid,
        fee_paid_on: fee.paidOn,
        fee_transaction: fee.transaction,
      }),
      ...(outline && {
        outline_paid: outline.paid,
        outline_paid_on: outline.paidOn,
        outline_transaction: outline.transaction,
      }),
      waiver: input.waiver,
      waiver_reason: input.waiver === null ? "" : input.waiver_reason,
    })
    .eq("id", registrationId)
    .eq("updated_at", input.version)
    .select("id");
  if (error) throw error;
  if (updated.length === 0) {
    refresh();
    return { status: "stale" };
  }
  await recordEvents(supabase, registrationId, events);
  refresh();
  return { status: "saved" };
}

// A coordinator changes a registration. The cutoffs do not apply, and the
// registrant is not emailed.
export async function saveRegistration(
  rawId: string,
  _prev: { status: string },
  form: FormData,
): Promise<State> {
  const supabase = await requireAuth();
  const registrationId = id.parse(rawId);
  const { data: existing, error: readError } = await supabase
    .from("registrations")
    .select("status, training_id")
    .eq("id", registrationId)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing || existing.status === "cancelled") return { status: "error" };

  const parsed = parseRegistrationForm(form);
  if (!parsed.success) return { status: "error" };
  const input = parsed.data;
  const training = await getTrainingById(existing.training_id);
  const allowed = new Set(training.sessions.map((s) => s.id));
  if (!input.session_ids.every((s) => allowed.has(s))) return { status: "error" };

  const { error } = await supabase
    .from("registrations")
    .update(toRow(input))
    .eq("id", registrationId);
  if (error) throw error;
  await replaceSessions(registrationId, input);
  await recordEvents(supabase, registrationId, ["edited"]);
  refresh();
  return { status: "saved" };
}

// Cancels on the registrant's behalf and tells them by email.
export async function cancelRegistration(rawId: string): Promise<{ status: string }> {
  const supabase = await requireAuth();
  const registrationId = id.parse(rawId);
  const { data: existing, error: readError } = await supabase
    .from("registrations")
    .select("status, training_id, email, first_name, locale")
    .eq("id", registrationId)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing || existing.status === "cancelled") return { status: "error" };

  const { error } = await supabase
    .from("registrations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", registrationId);
  if (error) throw error;
  await recordEvents(supabase, registrationId, ["cancelled"]);
  await sendCancellation({
    locale: existing.locale,
    training: await getTrainingById(existing.training_id),
    email: existing.email,
    firstName: existing.first_name,
  });
  refresh();
  return { status: "cancelled" };
}

// Gives the registration a new edit link and emails it, in the language the
// person registered in. The old link stops working.
export async function sendEditLink(rawId: string): Promise<State> {
  const supabase = await requireAuth();
  const registrationId = id.parse(rawId);
  const { data: existing, error: readError } = await supabase
    .from("registrations")
    .select("*, registration_sessions(session_id)")
    .eq("id", registrationId)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing || existing.status === "cancelled") return { status: "error" };
  const registration = registrationSchema.safeParse({
    ...existing,
    partner_first_name: existing.partner_first_name ?? undefined,
    partner_last_name: existing.partner_last_name ?? undefined,
    session_ids: existing.registration_sessions.map((s) => s.session_id),
  });
  if (!registration.success) return { status: "error" };

  // The email goes first: if it fails, the old link keeps working.
  const { token, hash } = newEditToken();
  await sendConfirmation({
    locale: existing.locale,
    training: await getTrainingById(existing.training_id),
    registration: registration.data,
    token,
    waived: existing.waiver !== null,
  });
  const { error } = await supabase
    .from("registrations")
    .update({ edit_token_hash: hash })
    .eq("id", registrationId);
  if (error) throw error;
  await recordEvents(supabase, registrationId, ["link_sent"]);
  refresh();
  return { status: "saved" };
}
