import { List, Stack } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FactBox } from "@/components/ui/fact-box";
import { PageHeading } from "@/components/ui/page-heading";
import { PageMessage } from "@/components/ui/page-message";
import { TitledSection } from "@/components/ui/titled-section";
import { OutlineOrders } from "@/features/coordinator/OutlineOrders";
import { summarize } from "@/features/coordinator/summary";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadCoordination } from "@/lib/coordinator";
import { daysUntil } from "@/lib/domain/coordination";
import { formatEuro } from "@/lib/domain/fees";
import { berlinDayTime } from "@/lib/domain/sessions";

import { saveOutlineOrder } from "../actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/outlines">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator" });
  return { title: t("nav.outlines") };
}

export default async function OutlinesPage({ params }: Props) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, th] = await Promise.all([getTranslations("coordinator"), getTranslations("home")]);
  const { data, now } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const { training } = data;
  const due = training.outline_order_deadline ? new Date(training.outline_order_deadline) : null;
  const days = due ? daysUntil(due, now) : null;

  return (
    <Stack gap="10" maxW="3xl">
      <PageHeading
        title={t("nav.outlines")}
        subtitle={t("outlinesLead", { price: formatEuro(training.outline_price_cents, locale) })}
      />
      {due && days !== null && (
        <FactBox
          tone={days >= 0 ? "warning" : "neutral"}
          label={t("orderDue")}
          value={berlinDayTime(due, locale, th("lordsDay"))}
          note={days >= 0 ? `${t("daysLeft", { count: days })}. ${t("orderExtras")}` : t("passed")}
        />
      )}
      <OutlineOrders
        trainingId={training.id}
        stock={summarize(data).stock}
        saveOrder={saveOutlineOrder}
      />
      <TitledSection title={t("howCountWorks")}>
        <List.Root color="fg.muted" ps="5" gap="2" mt="2">
          <List.Item>{t("countRule.first")}</List.Item>
          <List.Item>{t("countRule.second")}</List.Item>
          <List.Item>{t("countRule.excluded")}</List.Item>
        </List.Root>
      </TitledSection>
    </Stack>
  );
}
