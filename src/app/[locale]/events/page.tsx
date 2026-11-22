import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventsOverview } from "@/features/church/EventsOverview";
import { AddToCalendar } from "@/features/registration/AddToCalendar";
import { MainColumn } from "@/features/shell/MainColumn";
import { requireLocale } from "@/i18n/locale";
import { getUpcomingEvents } from "@/lib/cms";
import { siteUrl } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/events">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "site" });
  return { title: t("eventsTitle") };
}

export default async function EventsPage({ params }: PageProps<"/[locale]/events">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const [t, events] = await Promise.all([
    getTranslations({ locale, namespace: "site" }),
    getUpcomingEvents(locale, 50),
  ]);
  return (
    <MainColumn>
      <EventsOverview
        events={events}
        subscribe={
          <AddToCalendar
            icsUrl={`${siteUrl()}/${locale}/events.ics`}
            label={t("subscribeEvents")}
          />
        }
      />
    </MainColumn>
  );
}
