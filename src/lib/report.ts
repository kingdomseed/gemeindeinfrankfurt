import "server-only";
import { loadAttendance, markKey } from "@/lib/attendance";
import type { CoordinatorDashboard } from "@/lib/coordinator";
import { absenceCounts, overLimit } from "@/lib/domain/attendance";
import {
  absencesWithinLimit,
  absentAt,
  reportNumbers,
  type ReportNumbers,
} from "@/lib/domain/report";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

const BUCKET = "receipts";

export type ReportAnswers = {
  tested: boolean | null;
  absencesLimited: boolean | null;
  nameTags: boolean | null;
  seatsAssigned: boolean | null;
  inPerson: boolean | null;
};
export type ReportQuestion = keyof ReportAnswers;

const updates = {
  tested: (a: boolean) => ({ report_tested: a }),
  absencesLimited: (a: boolean) => ({ report_absences_limited: a }),
  nameTags: (a: boolean) => ({ report_name_tags: a }),
  seatsAssigned: (a: boolean) => ({ report_seats_assigned: a }),
  inPerson: (a: boolean) => ({ report_in_person: a }),
} satisfies Record<ReportQuestion, (a: boolean) => object>;

export type Reimbursement = {
  id: string;
  description: string;
  amountCents: number;
  paidBy: string;
  paidOn: string | null;
  // A link to the invoice photo that works for an hour, or null without one.
  photoUrl: string | null;
};

export type ReportData = {
  answers: ReportAnswers;
  notes: string;
  firstDay: string | null;
  lastDay: string | null;
  // Other localities that registered through this church.
  localities: string[];
  testsPlanned: number;
  reimbursements: Reimbursement[];
};

export async function loadReport(
  supabase: CoordinatorClient,
  trainingId: string,
): Promise<ReportData> {
  const [training, costs, tests] = await Promise.all([
    supabase
      .from("trainings")
      .select(
        "report_tested, report_absences_limited, report_name_tags, report_seats_assigned, report_in_person, report_first_day, report_last_day, report_notes, localities(name, is_home, registrations(count))",
      )
      .eq("id", trainingId)
      .single(),
    supabase
      .from("reimbursements")
      .select("id, description, amount_cents, paid_by, paid_on, receipt_path")
      .eq("training_id", trainingId)
      .order("created_at"),
    supabase
      .from("test_slots")
      .select("id, sessions!inner(training_id)", { count: "exact", head: true })
      .eq("sessions.training_id", trainingId),
  ]);
  if (training.error) throw training.error;
  if (costs.error) throw costs.error;
  if (tests.error) throw tests.error;

  const paths = costs.data.flatMap((c) => (c.receipt_path ? [c.receipt_path] : []));
  const links = new Map<string, string>();
  if (paths.length > 0) {
    const { data, error } = await createAdminClient()
      .storage.from(BUCKET)
      .createSignedUrls(paths, 60 * 60);
    if (error) throw error;
    for (const link of data) if (link.path && link.signedUrl) links.set(link.path, link.signedUrl);
  }

  const t = training.data;
  return {
    answers: {
      tested: t.report_tested,
      absencesLimited: t.report_absences_limited,
      nameTags: t.report_name_tags,
      seatsAssigned: t.report_seats_assigned,
      inPerson: t.report_in_person,
    },
    notes: t.report_notes,
    firstDay: t.report_first_day,
    lastDay: t.report_last_day,
    localities: t.localities
      .filter((l) => !l.is_home && (l.registrations[0]?.count ?? 0) > 0)
      .map((l) => l.name)
      .toSorted((a, b) => a.localeCompare(b)),
    testsPlanned: tests.count ?? 0,
    reimbursements: costs.data.map((c) => ({
      id: c.id,
      description: c.description,
      amountCents: c.amount_cents,
      paidBy: c.paid_by,
      paidOn: c.paid_on,
      photoUrl: c.receipt_path ? (links.get(c.receipt_path) ?? null) : null,
    })),
  };
}

export async function saveAnswer(
  supabase: CoordinatorClient,
  trainingId: string,
  question: ReportQuestion,
  answer: boolean,
) {
  const { error } = await supabase
    .from("trainings")
    .update(updates[question](answer))
    .eq("id", trainingId);
  if (error) throw error;
}

export async function saveReportDetails(
  supabase: CoordinatorClient,
  trainingId: string,
  details: { notes: string; firstDay: string | null; lastDay: string | null },
) {
  const { error } = await supabase
    .from("trainings")
    .update({
      report_notes: details.notes,
      report_first_day: details.firstDay,
      report_last_day: details.lastDay,
    })
    .eq("id", trainingId);
  if (error) throw error;
}

const EXTENSIONS: Readonly<Record<string, string>> = { "image/png": "png", "image/webp": "webp" };

async function uploadPhoto(trainingId: string, photo: File) {
  const extension = EXTENSIONS[photo.type] ?? "jpg";
  const path = `${trainingId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await createAdminClient()
    .storage.from(BUCKET)
    .upload(path, photo, { contentType: photo.type });
  if (error) throw error;
  return path;
}

export async function addReimbursement(
  supabase: CoordinatorClient,
  trainingId: string,
  cost: {
    description: string;
    amountCents: number;
    paidBy: string;
    paidOn: string | null;
    photo: File | null;
  },
) {
  const receiptPath = cost.photo ? await uploadPhoto(trainingId, cost.photo) : null;
  const { error } = await supabase.from("reimbursements").insert({
    training_id: trainingId,
    description: cost.description,
    amount_cents: cost.amountCents,
    paid_by: cost.paidBy,
    paid_on: cost.paidOn,
    receipt_path: receiptPath,
  });
  if (error) throw error;
}

// Adds or replaces the invoice photo of a cost.
export async function attachReceipt(supabase: CoordinatorClient, id: string, photo: File) {
  const { data, error } = await supabase
    .from("reimbursements")
    .select("training_id, receipt_path")
    .eq("id", id)
    .single();
  if (error) throw error;
  const path = await uploadPhoto(data.training_id, photo);
  const saved = await supabase.from("reimbursements").update({ receipt_path: path }).eq("id", id);
  if (saved.error) throw saved.error;
  if (data.receipt_path) await createAdminClient().storage.from(BUCKET).remove([data.receipt_path]);
}

export async function removeReimbursement(supabase: CoordinatorClient, id: string) {
  const { data, error } = await supabase
    .from("reimbursements")
    .delete()
    .eq("id", id)
    .select("receipt_path")
    .single();
  if (error) throw error;
  if (data.receipt_path) await createAdminClient().storage.from(BUCKET).remove([data.receipt_path]);
}

export type ReportView = ReportData & {
  numbers: ReportNumbers;
  // Each answer as it stands: the coordinators' own, or what the data suggests.
  resolved: Record<ReportQuestion, { value: boolean; suggested: boolean }>;
  messages: { number: number; startsAt: string; absent: number }[];
  overLimit: { id: string; name: string; unexcused: number; excused: number }[];
  firstStart: string | null;
  lastEnd: string | null;
};

// Everything the report and the printed questionnaire show for a training.
export async function loadReportView(
  supabase: CoordinatorClient,
  dashboard: CoordinatorDashboard,
): Promise<ReportView> {
  const { training, registrations } = dashboard;
  const [report, marks] = await Promise.all([
    loadReport(supabase, training.id),
    loadAttendance(supabase, training.id),
  ]);
  const sessions = training.sessions.toSorted((a, b) => a.message_number - b.message_number);
  const active = registrations.filter((r) => r.status === "active");
  const people = active.map((r) => ({
    registration: r,
    seat: r.seat_type,
    chosen: new Set(r.registration_sessions.map((s) => s.session_id)),
    marks: new Map(
      sessions.flatMap((s) => {
        const m = marks[markKey(r.id, s.id)];
        return m ? [[s.id, m] as const] : [];
      }),
    ),
  }));
  const suggestions: Record<ReportQuestion, boolean> = {
    tested: report.testsPlanned > 0,
    absencesLimited: absencesWithinLimit(people),
    nameTags: true,
    seatsAssigned: true,
    inPerson: true,
  };
  const resolve = (q: ReportQuestion) => {
    const own = report.answers[q];
    return own === null
      ? { value: suggestions[q], suggested: true }
      : { value: own, suggested: false };
  };
  const starts = sessions.map((s) => s.starts_at).toSorted();
  const ends = sessions.map((s) => s.ends_at).toSorted();
  return {
    ...report,
    numbers: reportNumbers(registrations, {
      feeCents: training.fee_cents,
      outlinePriceCents: training.outline_price_cents,
    }),
    resolved: {
      tested: resolve("tested"),
      absencesLimited: resolve("absencesLimited"),
      nameTags: resolve("nameTags"),
      seatsAssigned: resolve("seatsAssigned"),
      inPerson: resolve("inPerson"),
    },
    messages: sessions.map((s) => ({
      number: s.message_number,
      startsAt: s.starts_at,
      absent: absentAt(people, s.id),
    })),
    overLimit: people.flatMap((p) => {
      const counts = absenceCounts(p.seat, p.chosen, p.marks);
      if (!overLimit(counts)) return [];
      const r = p.registration;
      const name = [
        `${r.first_name} ${r.last_name}`,
        r.partner_first_name && `${r.partner_first_name} ${r.partner_last_name ?? ""}`.trim(),
      ]
        .filter(Boolean)
        .join(" · ");
      return [{ id: r.id, name, ...counts }];
    }),
    firstStart: starts[0] ?? null,
    lastEnd: ends.at(-1) ?? null,
  };
}
