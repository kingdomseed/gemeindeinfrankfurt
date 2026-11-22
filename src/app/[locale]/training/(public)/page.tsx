import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { TrainingOverview } from "@/features/home/TrainingOverview";
import { requireLocale } from "@/i18n/locale";
import { getPublishedTraining } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/training">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("appName") };
}

export default async function Home({ params }: PageProps<"/[locale]/training">) {
  setRequestLocale(requireLocale((await params).locale));
  const [t, training] = await Promise.all([getTranslations("home"), getPublishedTraining()]);
  if (!training) return <PageMessage title={t("noTraining")} body={t("noTrainingBody")} />;
  return <TrainingOverview training={training} />;
}
