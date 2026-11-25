import "server-only";
import { z } from "zod";

import { loadAttendance } from "@/lib/attendance";
import type { CoordinatorClient } from "@/lib/auth";
import type { CoordinatorDashboard } from "@/lib/coordinator";
import {
  buildReportView,
  reportedLocalities,
  type ReportAnswers,
  type ReportProjection,
  type ReportQuestion,
} from "@/lib/domain/report";
import { defaultReceiptStore, type ReceiptStore } from "@/lib/receipt-store";

export type { ReportAnswers, ReportQuestion };

const updates = {
  tested: (a: boolean) => ({ tested: a }),
  absencesLimited: (a: boolean) => ({ absences_limited: a }),
  nameTags: (a: boolean) => ({ name_tags: a }),
  seatsAssigned: (a: boolean) => ({ seats_assigned: a }),
  inPerson: (a: boolean) => ({ in_person: a }),
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
  detailsUpdatedAt: string;
  // Other localities that registered through this church.
  localities: string[];
  testsPlanned: number;
  reimbursements: Reimbursement[];
};

export async function loadReport(
  supabase: CoordinatorClient,
  trainingId: string,
  store: ReceiptStore = defaultReceiptStore,
): Promise<ReportData> {
  const [report, home, regs, costs, tests] = await Promise.all([
    supabase
      .from("training_reports")
      .select(
        "tested, absences_limited, name_tags, seats_assigned, in_person, first_day, last_day, notes, details_updated_at",
      )
      .eq("training_id", trainingId)
      .maybeSingle(),
    supabase
      .from("localities")
      .select("name")
      .eq("training_id", trainingId)
      .eq("is_home", true)
      .maybeSingle(),
    supabase
      .from("registrations")
      .select("status, other_locality, localities(name, is_home)")
      .eq("training_id", trainingId)
      .eq("status", "active"),
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
  if (report.error) throw report.error;
  if (home.error) throw home.error;
  if (regs.error) throw regs.error;
  if (costs.error) throw costs.error;
  if (tests.error) throw tests.error;

  const paths = costs.data.flatMap((c) => (c.receipt_path ? [c.receipt_path] : []));
  const links = paths.length > 0 ? await store.signUrls(paths) : new Map<string, string>();

  const r = report.data;
  return {
    answers: {
      tested: r?.tested ?? null,
      absencesLimited: r?.absences_limited ?? null,
      nameTags: r?.name_tags ?? null,
      seatsAssigned: r?.seats_assigned ?? null,
      inPerson: r?.in_person ?? null,
    },
    notes: r?.notes ?? "",
    firstDay: r?.first_day ?? null,
    lastDay: r?.last_day ?? null,
    detailsUpdatedAt: r?.details_updated_at ?? "",
    localities: reportedLocalities(regs.data, home.data?.name),
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
    .from("training_reports")
    .upsert({ training_id: trainingId, ...updates[question](answer) });
  if (error) throw error;
}

const reportSaveStatus = z.enum(["saved", "stale"]);

export async function saveReportDetails(
  supabase: CoordinatorClient,
  trainingId: string,
  details: { notes: string; firstDay: string | null; lastDay: string | null },
  expectedUpdatedAt?: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("save_report_details", {
    p_training: trainingId,
    p_notes: details.notes,
    p_check_version: expectedUpdatedAt !== undefined,
    ...(details.firstDay !== null ? { p_first_day: details.firstDay } : {}),
    ...(details.lastDay !== null ? { p_last_day: details.lastDay } : {}),
    ...(expectedUpdatedAt ? { p_expected_details_updated_at: expectedUpdatedAt } : {}),
  });
  if (error) throw error;
  return reportSaveStatus.parse(data) === "saved";
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
  store: ReceiptStore = defaultReceiptStore,
) {
  const receiptPath = cost.photo ? await store.upload(trainingId, cost.photo) : null;
  const { error } = await supabase.from("reimbursements").insert({
    training_id: trainingId,
    description: cost.description,
    amount_cents: cost.amountCents,
    paid_by: cost.paidBy,
    paid_on: cost.paidOn,
    receipt_path: receiptPath,
  });
  if (error) {
    if (receiptPath) await store.remove(receiptPath).catch(() => undefined);
    throw error;
  }
}

// Adds or replaces the invoice photo of a cost.
export async function attachReceipt(
  supabase: CoordinatorClient,
  id: string,
  photo: File,
  store: ReceiptStore = defaultReceiptStore,
) {
  const { data, error } = await supabase
    .from("reimbursements")
    .select("training_id, receipt_path")
    .eq("id", id)
    .single();
  if (error) throw error;
  const path = await store.upload(data.training_id, photo);
  const saved = await supabase.from("reimbursements").update({ receipt_path: path }).eq("id", id);
  if (saved.error) {
    await store.remove(path).catch(() => undefined);
    throw saved.error;
  }
  if (data.receipt_path) await store.remove(data.receipt_path);
}

export async function removeReimbursement(
  supabase: CoordinatorClient,
  id: string,
  store: ReceiptStore = defaultReceiptStore,
) {
  const { data, error } = await supabase
    .from("reimbursements")
    .delete()
    .eq("id", id)
    .select("receipt_path")
    .single();
  if (error) throw error;
  if (data.receipt_path) await store.remove(data.receipt_path);
}

export type ReportView = ReportData & ReportProjection;

// Everything the report and the printed questionnaire show for a training.
export async function loadReportView(
  supabase: CoordinatorClient,
  dashboard: CoordinatorDashboard,
  store: ReceiptStore = defaultReceiptStore,
): Promise<ReportView> {
  const { training, registrations } = dashboard;
  const [report, marks] = await Promise.all([
    loadReport(supabase, training.id, store),
    loadAttendance(supabase, training.id),
  ]);
  return {
    ...report,
    ...buildReportView({
      prices: { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents },
      sessions: training.sessions,
      registrations,
      marks,
      answers: report.answers,
      testsPlanned: report.testsPlanned,
      lastDay: report.lastDay,
    }),
  };
}
