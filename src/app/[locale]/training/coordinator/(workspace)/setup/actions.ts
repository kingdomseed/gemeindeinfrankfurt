"use server";

import { getTranslations } from "next-intl/server";
import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { requireAuth } from "@/lib/auth";
import { fromBerlinWallTime } from "@/lib/domain/berlin-time";
import { parseEuroCents } from "@/lib/domain/fees";
import { scheduleFingerprint } from "@/lib/domain/list-sync";
import { isBerlinWeekday } from "@/lib/domain/sessions";

const id = z.uuid();
const text = (max: number) => z.string().trim().min(1).max(max);
const euro = z.string().transform((value, ctx) => {
  const cents = parseEuroCents(value);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: "not an amount" });
    return z.NEVER;
  }
  return cents;
});

const details = z.object({
  title_de: text(200),
  title_en: text(200),
  title_ru: text(200),
  fee: euro,
  outline_price: euro,
  payee_name: text(200),
  payee_iban: text(50),
  payment_reference: text(140),
  venue: text(300),
  deadline_date: z.union([z.iso.date(), z.literal("")]),
  deadline_time: z.union([z.iso.time({ precision: -1 }), z.literal("")]),
  version: z.string().optional(),
});

// The training's name, fee, payment details, venue and outline deadline.
export async function saveTrainingDetails(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const trainingId = id.parse(rawTrainingId);
  const parsed = details.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const d = parsed.data;
  const deadline =
    d.deadline_date === ""
      ? null
      : fromBerlinWallTime({ date: d.deadline_date, time: d.deadline_time || "16:00" });
  if (d.deadline_date !== "" && !deadline) return { status: "error" };
  const row = {
    title: { de: d.title_de, en: d.title_en, ru: d.title_ru },
    fee_cents: d.fee,
    outline_price_cents: d.outline_price,
    payee_name: d.payee_name,
    payee_iban: d.payee_iban,
    payment_reference: d.payment_reference,
    venue: d.venue,
    outline_order_deadline: deadline?.toISOString() ?? null,
  };
  const query = supabase.from("trainings").update(row).eq("id", trainingId);
  if (d.version !== undefined) {
    const { data: updated, error } = await query.eq("updated_at", d.version).select("id");
    if (error) throw error;
    if (updated.length === 0) {
      refresh();
      return { status: "stale" };
    }
  } else {
    const { error } = await query;
    if (error) throw error;
  }
  refresh();
  return { status: "saved" };
}

const intent = z.union([
  z.literal("save"),
  z.literal("add"),
  z.templateLiteral(["remove:", z.uuid()]),
]);
const DAY_MS = 24 * 3600_000;

// Saves every message's times, adds a message a day after the last one, or
// removes the last message when nobody has chosen it.
export async function saveSchedule(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const trainingId = id.parse(rawTrainingId);
  const action = intent.safeParse(form.get("intent"));
  if (!action.success) return { status: "error" };
  const t = await getTranslations("coordinator.setup");

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      "id, message_number, starts_at, ends_at, is_tested, is_online, registration_sessions(count), attendance(count)",
    )
    .eq("training_id", trainingId)
    .order("message_number");
  if (error) throw error;

  if (action.data === "add") {
    const last = sessions.at(-1);
    const start = last ? Date.parse(last.starts_at) + DAY_MS : Date.now() + DAY_MS;
    const end = last ? Date.parse(last.ends_at) + DAY_MS : start + 2.5 * 3600_000;
    const { error: insertError } = await supabase.from("sessions").insert({
      training_id: trainingId,
      message_number: (last?.message_number ?? 0) + 1,
      starts_at: new Date(start).toISOString(),
      ends_at: new Date(end).toISOString(),
      is_online: isBerlinWeekday(start),
    });
    if (insertError) throw insertError;
    refresh();
    return { status: "saved" };
  }

  if (action.data.startsWith("remove:")) {
    const removeId = action.data.slice("remove:".length);
    // Only the last message can go, so the numbers stay 1 to n.
    const session = sessions.at(-1);
    if (session?.id !== removeId) return { status: "error" };
    const used = [...session.registration_sessions, ...session.attendance].some((c) => c.count > 0);
    if (used) return { status: "error", message: t("cannotRemove") };
    const { error: deleteError } = await supabase.from("sessions").delete().eq("id", removeId);
    if (deleteError) throw deleteError;
    refresh();
    return { status: "saved" };
  }

  const version = form.get("version");
  if (typeof version === "string" && scheduleFingerprint(sessions) !== version) {
    refresh();
    return { status: "stale" };
  }

  const field = (name: string) => z.string().catch("").parse(form.get(name));
  const updates = [];
  for (const s of sessions) {
    const date = field(`date_${s.id}`);
    const start = fromBerlinWallTime({ date, time: field(`start_${s.id}`) });
    const end = fromBerlinWallTime({ date, time: field(`end_${s.id}`) });
    if (!start || !end || end <= start) {
      return { status: "error", message: t("badTimes", { number: s.message_number }) };
    }
    updates.push({
      id: s.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      is_tested: form.get(`tested_${s.id}`) === "on",
      is_online: form.get(`online_${s.id}`) === "on",
    });
  }
  const results = await Promise.all(
    updates.map(({ id: sessionId, ...row }) =>
      supabase.from("sessions").update(row).eq("id", sessionId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  refresh();
  return { status: "saved" };
}

const localityIntent = z.union([z.literal("add"), z.templateLiteral(["remove:", z.uuid()])]);

// Adds a city, or removes one that nobody registered from.
export async function saveLocalities(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const trainingId = id.parse(rawTrainingId);
  const action = localityIntent.safeParse(form.get("intent"));
  if (!action.success) return { status: "error" };

  if (action.data === "add") {
    const name = text(100).safeParse(form.get("name"));
    if (!name.success) return { status: "error" };
    const { error } = await supabase
      .from("localities")
      .insert({ training_id: trainingId, name: name.data });
    if (error) return { status: "error" };
    refresh();
    return { status: "saved" };
  }

  const removeId = action.data.slice("remove:".length);
  const { count, error: countError } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("locality_id", removeId);
  if (countError) throw countError;
  if ((count ?? 0) > 0) return { status: "error" };
  const { error } = await supabase
    .from("localities")
    .delete()
    .eq("id", removeId)
    .eq("training_id", trainingId)
    .eq("is_home", false);
  if (error) throw error;
  refresh();
  return { status: "saved" };
}

// Adds an attendance site, or removes an unused one when more than one remains.
export async function saveTrainingSites(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const trainingId = id.parse(rawTrainingId);
  const action = localityIntent.safeParse(form.get("intent"));
  if (!action.success) return { status: "error" };

  if (action.data === "add") {
    const name = text(100).safeParse(form.get("name"));
    if (!name.success) return { status: "error" };
    const { data: existing, error: readError } = await supabase
      .from("training_sites")
      .select("sort_order")
      .eq("training_id", trainingId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (readError) throw readError;
    const { error } = await supabase.from("training_sites").insert({
      training_id: trainingId,
      name: name.data,
      sort_order: (existing?.sort_order ?? 0) + 1,
    });
    if (error) return { status: "error" };
    refresh();
    return { status: "saved" };
  }

  const removeId = action.data.slice("remove:".length);
  const [{ count: used, error: countError }, { count: total, error: totalError }] =
    await Promise.all([
      supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("site_id", removeId),
      supabase
        .from("training_sites")
        .select("id", { count: "exact", head: true })
        .eq("training_id", trainingId),
    ]);
  if (countError) throw countError;
  if (totalError) throw totalError;
  if ((used ?? 0) > 0 || (total ?? 0) <= 1) return { status: "error" };
  const { error } = await supabase
    .from("training_sites")
    .delete()
    .eq("id", removeId)
    .eq("training_id", trainingId);
  if (error) throw error;
  refresh();
  return { status: "saved" };
}
