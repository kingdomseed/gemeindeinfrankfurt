import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { ReportWorkspace } from "@/features/coordinator/ReportWorkspace";
import { sectionHref } from "@/features/coordinator/sections";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadCoordination } from "@/lib/coordinator";
import { formatEuro } from "@/lib/domain/fees";
import { reportDue } from "@/lib/domain/report";
import { berlinDay } from "@/lib/domain/sessions";
import { loadReportView, type ReportQuestion } from "@/lib/report";

import { addCost, addPhoto, answerQuestion, removeCost, saveDetails } from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/report">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.report" });
  return { title: t("title") };
}

const questions: readonly ReportQuestion[] = [
  "tested",
  "absencesLimited",
  "nameTags",
  "seatsAssigned",
  "inPerson",
];

export default async function ReportPage({ params }: Props) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, th, format] = await Promise.all([
    getTranslations("coordinator.report"),
    getTranslations("home"),
    getFormatter(),
  ]);
  const { data, supabase, now } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;
  const trainingId = data.training.id;
  const view = await loadReportView(supabase, data);
  const euro = (cents: number) => formatEuro(cents, locale);
  const day = (iso: string) => berlinDay(new Date(iso), locale, th("lordsDay"));
  // A date column ("2027-01-09") is a calendar day, read at noon so no time zone moves it.
  const shownDay = (date: string | null, instant: string | null) => {
    if (date) return day(`${date}T12:00:00Z`);
    if (instant) return day(instant);
    return "–";
  };

  const due = view.lastEnd ? reportDue(new Date(view.lastEnd)) : null;
  const daysLeft = due ? Math.ceil((due.getTime() - now.getTime()) / 86_400_000) : 0;
  const n = view.numbers;
  const total = view.reimbursements.reduce((sum, c) => sum + c.amountCents, 0);

  return (
    <ReportWorkspace
      questionnaireHref={`${sectionHref("report")}/questionnaire`}
      due={
        due
          ? {
              date: day(due.toISOString()),
              note: daysLeft >= 0 ? t("daysLeft", { count: daysLeft }) : t("overdue"),
            }
          : null
      }
      stats={[
        { label: t("seats"), value: String(n.seats) },
        {
          label: t("feesCollected"),
          value: String(n.feesCollected),
          help: n.waived > 0 ? t("waived", { count: n.waived }) : undefined,
        },
        { label: t("collected"), value: euro(n.collectedCents) },
        {
          label: t("outlineMoney"),
          value: euro(n.outlineCents),
          help: t("outlineCount", { count: n.outlines }),
        },
        { label: t("live"), value: String(n.live), help: t("liveHelp") },
        { label: t("ukraine"), value: String(n.ukraine) },
      ]}
      localities={
        view.localities.length > 0
          ? t("localities", { names: format.list(view.localities, { type: "conjunction" }) })
          : null
      }
      dates={{
        first: shownDay(view.firstDay, view.firstStart),
        last: shownDay(view.lastDay, view.lastEnd),
      }}
      details={{
        notes: view.notes,
        firstDay: view.firstDay,
        lastDay: view.lastDay,
        save: saveDetails.bind(null, trainingId),
      }}
      questions={questions.map((q) => ({
        key: q,
        label: t(`question.${q}`),
        value: view.resolved[q].value,
        suggested: view.resolved[q].suggested,
        labels:
          q === "inPerson"
            ? { yes: t("inPerson"), no: t("online") }
            : { yes: t("yes"), no: t("no") },
        answer: answerQuestion.bind(null, trainingId, q),
      }))}
      messages={view.messages.map((m) => ({
        number: m.number,
        date: day(m.startsAt),
        absent: m.absent,
      }))}
      overLimit={view.overLimit}
      costs={{
        rows: view.reimbursements.map((c) => ({
          id: c.id,
          description: c.description,
          amount: euro(c.amountCents),
          meta: [
            c.paidBy && t("paidBy", { name: c.paidBy }),
            c.paidOn &&
              format.dateTime(new Date(`${c.paidOn}T12:00:00Z`), {
                day: "numeric",
                month: "short",
              }),
          ]
            .filter(Boolean)
            .join(" · "),
          photoUrl: c.photoUrl,
          addPhoto: addPhoto.bind(null, c.id),
        })),
        total: euro(total),
        add: addCost.bind(null, trainingId),
        remove: removeCost,
      }}
    />
  );
}
