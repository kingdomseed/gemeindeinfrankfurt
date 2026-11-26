import { Stack } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { PageHeading } from "@/components/ui/page-heading";
import { PaymentStats } from "@/features/coordinator/PaymentStats";
import { RegistrationList } from "@/features/coordinator/RegistrationList";
import { summarize } from "@/features/coordinator/summary";
import { requireLocale } from "@/i18n/locale";
import { listFilters } from "@/lib/domain/payments";

import { requireActiveWorkspace } from "../workspace";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/registrations">;

// Links from the overview open the list on a filter or a search.
const opening = z.object({
  show: z.enum(listFilters).catch("all"),
  q: z.string().max(200).catch(""),
});

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator" });
  return { title: t("registrations") };
}

export default async function RegistrationsPage({ params, searchParams }: Props) {
  const ws = await requireActiveWorkspace((await params).locale, "registrations");
  if (!ws.ok) return ws.fallback;
  const t = await getTranslations("coordinator");
  const { data } = ws.workspace;

  const summary = summarize(data);
  const open = opening.parse({ show: "all", q: "", ...(await searchParams) });
  return (
    <Stack gap="8">
      <PageHeading
        title={t("registrations")}
        subtitle={t("registrationsLead", {
          seats: summary.active.length,
          people: summary.people,
        })}
      />
      <PaymentStats summary={summary} />
      <RegistrationList rows={summary.rows} initialFilter={open.show} initialQuery={open.q} />
    </Stack>
  );
}
