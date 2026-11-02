import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { TrainingOverview } from "@/features/home/TrainingOverview";
import { requireLocale } from "@/i18n/locale";
import { getPublishedTraining } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home({ params }: PageProps<"/[locale]">) {
  setRequestLocale(requireLocale((await params).locale));
  const [t, training] = await Promise.all([getTranslations("home"), getPublishedTraining()]);
  if (!training) return <PageMessage>{t("noTraining")}</PageMessage>;
  return <TrainingOverview training={training} />;
}
