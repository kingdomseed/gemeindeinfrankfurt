import { Heading, Stack } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeading } from "@/components/ui/page-heading";
import { PageMessage } from "@/components/ui/page-message";
import { DeadlineGrid } from "@/features/coordinator/DeadlineGrid";
import { LatestChanges } from "@/features/coordinator/LatestChanges";
import { NeedsAttention } from "@/features/coordinator/NeedsAttention";
import { PaymentStats } from "@/features/coordinator/PaymentStats";
import { summarize } from "@/features/coordinator/summary";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadCoordination, loadRecentEvents } from "@/lib/coordinator";
import { trainingDeadlines } from "@/lib/domain/coordination";
import { trainingDates } from "@/lib/domain/sessions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator" });
  return { title: t("nav.overview") };
}

export default async function CoordinatorOverviewPage({ params }: Props) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, th] = await Promise.all([getTranslations("coordinator"), getTranslations("home")]);
  const { supabase, data, now } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const { training } = data;
  const summary = summarize(data);
  const events = await loadRecentEvents(supabase, training.id);
  const deadlines = trainingDeadlines(training.sessions, training.outline_order_deadline);
  const dates = trainingDates(training.sessions, locale, th("lordsDay"));
  const open = deadlines !== null && now < deadlines.registrationCloses;
  const outlinesNeeded = summary.stock.reduce((n, s) => n + s.needed, 0);

  return (
    <Stack gap="10">
      <PageHeading
        title={t("nav.overview")}
        subtitle={[
          training.title[locale],
          dates,
          open ? t("registrationOpen") : t("registrationClosed"),
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      {deadlines && (
        <DeadlineGrid deadlines={deadlines} outlinesNeeded={outlinesNeeded} now={now} />
      )}
      <Stack as="section" aria-labelledby="money-heading" gap="3">
        <Heading as="h2" id="money-heading" size="xl">
          {t("seatsAndPayments")}
        </Heading>
        <PaymentStats summary={summary} detailed />
      </Stack>
      <NeedsAttention summary={summary} />
      <LatestChanges rows={summary.rows} events={events} now={now} />
    </Stack>
  );
}
