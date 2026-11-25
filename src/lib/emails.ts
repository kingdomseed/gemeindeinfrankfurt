import "server-only";
import { currentCoordinatorName, type CoordinatorClient } from "@/lib/auth";
import type { AudienceMember } from "@/lib/domain/emails";
import type { FeePrices } from "@/lib/domain/fees";
import { feesForRegistration, openCents } from "@/lib/domain/payments";
import type { Language, SeatType } from "@/lib/domain/types";

// One active registration as an email recipient. Only the server sees this.
export type Recipient = AudienceMember & {
  email: string;
  firstName: string;
  partnerFirstName: string | null;
  sessionIds: string[];
  // What is still open, in cents, for the payment reminder.
  feeOpenCents: number;
  outlineOpenCents: number;
  outlineCount: number;
};

// Everyone registered for the training (not cancelled), with what each owes.
export async function loadRecipients(
  supabase: CoordinatorClient,
  trainingId: string,
  prices: FeePrices,
): Promise<Recipient[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "email, locale, first_name, partner_first_name, seat_type, waiver, outline_language, second_outline_language, fee_paid, outline_paid, registration_sessions(session_id), study_group_members(group_id)",
    )
    .eq("training_id", trainingId)
    .eq("status", "active");
  if (error) throw error;
  return data.map((r) => {
    const fees = feesForRegistration(r, prices);
    const seat: SeatType = r.seat_type;
    const locale: Language = r.locale;
    return {
      email: r.email,
      locale,
      seat,
      firstName: r.first_name,
      partnerFirstName: r.partner_first_name,
      sessionIds: r.registration_sessions.map((s) => s.session_id),
      groupId: r.study_group_members?.group_id ?? null,
      openCents: openCents({ ...r, status: "active" }, fees),
      feeOpenCents: r.fee_paid ? 0 : fees.trainingCents,
      outlineOpenCents: r.outline_paid ? 0 : fees.outlineCents,
      outlineCount: fees.outlineCount,
    };
  });
}

export type EmailKind = "payment_reminder" | "before_training" | "message";

export type SentEmail = {
  id: string;
  kind: EmailKind;
  subject: string;
  sentBy: string;
  count: number;
  sentAt: string;
};

// What coordinators sent for the training, newest first.
export async function loadSentEmails(
  supabase: CoordinatorClient,
  trainingId: string,
): Promise<SentEmail[]> {
  const { data, error } = await supabase
    .from("email_sends")
    .select("id, kind, subject, sent_by, recipient_count, sent_at")
    .eq("training_id", trainingId)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return data.flatMap((s) =>
    s.kind === "payment_reminder" || s.kind === "before_training" || s.kind === "message"
      ? [
          {
            id: s.id,
            kind: s.kind,
            subject: s.subject,
            sentBy: s.sent_by,
            count: s.recipient_count,
            sentAt: s.sent_at,
          },
        ]
      : [],
  );
}

export async function recordSend(
  supabase: CoordinatorClient,
  send: { trainingId: string; kind: EmailKind; subject: string; count: number },
) {
  const name = await currentCoordinatorName(supabase);
  const { error } = await supabase.from("email_sends").insert({
    training_id: send.trainingId,
    kind: send.kind,
    subject: send.subject.slice(0, 300),
    sent_by: name,
    recipient_count: send.count,
  });
  if (error) throw error;
}
