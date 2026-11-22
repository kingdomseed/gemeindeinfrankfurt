import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventsOverview } from "@/features/church/EventsOverview";
import { MainColumn } from "@/features/shell/MainColumn";
import { requireLocale } from "@/i18n/locale";
import { getUpcomingEvents } from "@/lib/cms";

export async function generateMetadata({ params }: PageProps<"/[locale]/events">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "site" });
  return { title: t("eventsTitle") };
}

export default async function EventsPage({ params }: PageProps<"/[locale]/events">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <MainColumn>
      <EventsOverview events={await getUpcomingEvents(locale, 50)} />
    </MainColumn>
  );
}
