import { getTranslations } from "next-intl/server";

import { Questionnaire } from "@/features/coordinator/Questionnaire";
import { sectionHref } from "@/features/coordinator/sections";
import { requireLocale } from "@/i18n/locale";
import { BERLIN_TIME_ZONE, calendarDayNoon } from "@/lib/domain/berlin-time";
import { formatEuro } from "@/lib/domain/fees";
import { loadReportView } from "@/lib/report";

import { requireActiveWorkspace } from "../../workspace";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/report/questionnaire">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.report" });
  return { title: t("printQuestionnaire") };
}

// Lebensstrom's questionnaire is in German, so the printed copy always is.
const FORM_LOCALE = "de";

const germanDate = new Intl.DateTimeFormat("de-DE", {
  timeZone: BERLIN_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const date = (iso: string | null) => (iso ? germanDate.format(new Date(iso)) : "–");
const calendar = (d: string | null) => (d ? germanDate.format(calendarDayNoon(d)) : null);

export default async function QuestionnairePage({ params }: Props) {
  const ws = await requireActiveWorkspace((await params).locale, "report");
  if (!ws.ok) return ws.fallback;
  const { data, supabase } = ws.workspace;
  const [t, q, view] = await Promise.all([
    getTranslations("coordinator.report"),
    getTranslations({ locale: FORM_LOCALE, namespace: "coordinator.questionnaire" }),
    loadReportView(supabase, data),
  ]);
  const n = view.numbers;
  const euro = (cents: number) => formatEuro(cents, FORM_LOCALE);
  const yesNo = (value: boolean) => (value ? q("yes") : q("no"));
  const r = view.resolved;
  const total = view.reimbursements.reduce((sum, c) => sum + c.amountCents, 0);
  const notes = [
    view.notes,
    view.overLimit.length > 0 ? q("overLimitNote", { count: view.overLimit.length }) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <>
      <style>{"@page { size: A4; margin: 15mm 18mm; }"}</style>
      <Questionnaire
        toolbar={{ backHref: sectionHref("report"), back: t("backToReport"), print: t("print") }}
        lang={FORM_LOCALE}
        text={{
          publisher: q("publisher"),
          title: q("title"),
          church:
            view.localities.length > 0
              ? q("churchWith", { localities: view.localities.join(", ") })
              : q("church"),
          messagesTitle: q("messages"),
          message: q("message"),
          dateShown: q("dateShown"),
          absent: q("absent"),
          notesTitle: q("notes"),
          costsTitle: q("costs"),
          place: q("place"),
          signature: q("signature"),
        }}
        rows={[
          { label: q("firstDay"), value: calendar(view.firstDay) ?? date(view.firstStart) },
          { label: q("lastDay"), value: calendar(view.lastDay) ?? date(view.lastEnd) },
          { label: q("seats"), value: String(n.seats) },
          { label: q("feesCollected"), value: String(n.feesCollected) },
          { label: q("collected"), value: euro(n.collectedCents) },
          { label: q("outlineMoney"), value: euro(n.outlineCents) },
          { label: q("ukraine"), value: String(n.ukraine) },
          { label: q("tested"), value: yesNo(r.tested.value) },
          { label: q("absencesLimited"), value: yesNo(r.absencesLimited.value) },
          { label: q("nameTags"), value: yesNo(r.nameTags.value) },
          { label: q("seatsAssigned"), value: yesNo(r.seatsAssigned.value) },
          { label: q("onlineOrInPerson"), value: r.inPerson.value ? q("inPerson") : q("online") },
        ]}
        messages={view.messages.map((m) => ({
          number: m.number,
          date: date(m.startsAt),
          absent: m.absent,
        }))}
        notes={notes}
        costs={
          view.reimbursements.length > 0
            ? q("costsLine", { count: view.reimbursements.length, total: euro(total) })
            : q("noCosts")
        }
      />
    </>
  );
}
