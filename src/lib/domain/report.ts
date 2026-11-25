import { absenceCounts, attendanceMarkKey, isRequired, overLimit, type Mark } from "./attendance";
import { addCalendarDays, berlinDayKey, endOfBerlinDate } from "./berlin-time";
import type { FeePrices } from "./fees";
import { feesForRegistration, type PaymentRow } from "./payments";
import type { SeatType, Session } from "./types";

export type ReportAnswers = {
  tested: boolean | null;
  absencesLimited: boolean | null;
  nameTags: boolean | null;
  seatsAssigned: boolean | null;
  inPerson: boolean | null;
};
export type ReportQuestion = keyof ReportAnswers;

export type ReportRegistration = PaymentRow & { status: "active" | "cancelled" };

export type ReportRegistrationInput = ReportRegistration & {
  id: string;
  first_name: string;
  last_name: string;
  partner_first_name: string | null;
  partner_last_name: string | null;
  registration_sessions: readonly { session_id: string }[];
};

export type ReportNumbers = {
  seats: number;
  feesCollected: number;
  waived: number;
  collectedCents: number;
  outlineCents: number;
  outlines: number;
  live: number;
  ukraine: number;
};

// The questionnaire's numbers. Cancelled registrations do not count; a
// shared seat is one seat and one fee.
export function reportNumbers(
  rows: readonly ReportRegistration[],
  prices: FeePrices,
): ReportNumbers {
  const numbers: ReportNumbers = {
    seats: 0,
    feesCollected: 0,
    waived: 0,
    collectedCents: 0,
    outlineCents: 0,
    outlines: 0,
    live: 0,
    ukraine: 0,
  };
  for (const row of rows) {
    if (row.status !== "active") continue;
    const fees = feesForRegistration(row, prices);
    numbers.seats += 1;
    if (row.seat_type === "anaheim") numbers.live += 1;
    else if (row.waiver !== null) numbers.waived += 1;
    if (row.waiver === "ukraine_not_employed") numbers.ukraine += 1;
    if (row.fee_paid && fees.trainingCents > 0) {
      numbers.feesCollected += 1;
      numbers.collectedCents += fees.trainingCents;
    }
    if (row.outline_paid) {
      numbers.outlineCents += fees.outlineCents;
      numbers.outlines += fees.outlineCount;
    }
  }
  return numbers;
}

export type AttendancePerson = {
  seat: SeatType;
  chosen: ReadonlySet<string>;
  marks: ReadonlyMap<string, Mark>;
};

// How many people who had to come to a message were absent, excused or not.
export function absentAt(people: readonly AttendancePerson[], sessionId: string): number {
  return people.filter((p) => {
    const mark = p.marks.get(sessionId);
    return (mark === "absent" || mark === "excused") && isRequired(p.seat, p.chosen, sessionId);
  }).length;
}

// Whether everyone kept within the absence limit.
export function absencesWithinLimit(people: readonly AttendancePerson[]): boolean {
  return people.every((p) => !overLimit(absenceCounts(p.seat, p.chosen, p.marks)));
}

// The questionnaire, the fees and the reimbursements are due by the end of the
// day `REPORT_DAYS` calendar days after the last training day (Europe/Berlin).
export const REPORT_DAYS = 7;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function reportDue(lastDayOrInstant: Date | string): Date {
  const lastDate =
    typeof lastDayOrInstant === "string" && ISO_DATE.test(lastDayOrInstant)
      ? lastDayOrInstant
      : berlinDayKey(
          typeof lastDayOrInstant === "string" ? new Date(lastDayOrInstant) : lastDayOrInstant,
        );
  return endOfBerlinDate(addCalendarDays(lastDate, REPORT_DAYS));
}

export type ReportProjection = {
  numbers: ReportNumbers;
  resolved: Record<ReportQuestion, { value: boolean; suggested: boolean }>;
  messages: { number: number; startsAt: string; absent: number }[];
  overLimit: { id: string; name: string; unexcused: number; excused: number }[];
  firstStart: string | null;
  lastEnd: string | null;
  due: Date | null;
};

const byTime = (a: string, b: string) => Date.parse(a) - Date.parse(b);

// Pure projection for the Lebensstrom report and printed German questionnaire.
export function buildReportView(input: {
  prices: FeePrices;
  sessions: readonly Session[];
  registrations: readonly ReportRegistrationInput[];
  marks: Readonly<Record<string, Mark>>;
  answers: ReportAnswers;
  testsPlanned: number;
  lastDay: string | null;
}): ReportProjection {
  const sessions = input.sessions.toSorted((a, b) => a.message_number - b.message_number);
  const active = input.registrations.filter((r) => r.status === "active");
  const people = active.map((r) => ({
    registration: r,
    seat: r.seat_type,
    chosen: new Set(r.registration_sessions.map((s) => s.session_id)),
    marks: new Map(
      sessions.flatMap((s) => {
        const m = input.marks[attendanceMarkKey(r.id, s.id)];
        return m ? [[s.id, m] as const] : [];
      }),
    ),
  }));
  const suggestions: Record<ReportQuestion, boolean> = {
    tested: input.testsPlanned > 0,
    absencesLimited: absencesWithinLimit(people),
    nameTags: true,
    seatsAssigned: true,
    inPerson: true,
  };
  const resolve = (q: ReportQuestion) => {
    const own = input.answers[q];
    return own === null
      ? { value: suggestions[q], suggested: true }
      : { value: own, suggested: false };
  };
  const starts = sessions.map((s) => s.starts_at).toSorted(byTime);
  const ends = sessions.map((s) => s.ends_at).toSorted(byTime);
  const firstStart = starts[0] ?? null;
  const lastEnd = ends.at(-1) ?? null;
  const dueAnchor = input.lastDay ?? lastEnd;

  return {
    numbers: reportNumbers(input.registrations, input.prices),
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
    firstStart,
    lastEnd,
    due: dueAnchor ? reportDue(dueAnchor) : null,
  };
}

export type ReportLocalityRow = {
  status: "active" | "cancelled";
  other_locality: string;
  localities: { name: string; is_home: boolean } | null;
};

// Neighboring cities with at least one active registration, deduplicated
// case-insensitively and excluding the home locality.
export function reportedLocalities(rows: readonly ReportLocalityRow[], homeName = ""): string[] {
  const homeKey = homeName.trim().toLowerCase();
  const seen = new Map<string, string>();
  for (const row of rows) {
    if (row.status !== "active") continue;
    if (row.localities) {
      if (row.localities.is_home) continue;
      const key = row.localities.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, row.localities.name);
      continue;
    }
    const other = row.other_locality.trim();
    if (!other) continue;
    const key = other.toLowerCase();
    if (homeKey && key === homeKey) continue;
    if (!seen.has(key)) seen.set(key, other);
  }
  return [...seen.values()].toSorted((a, b) => a.localeCompare(b, "de"));
}
