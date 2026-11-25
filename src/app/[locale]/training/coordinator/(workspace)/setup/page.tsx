import { Button, Stack, Text } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeading } from "@/components/ui/page-heading";
import { PageMessage } from "@/components/ui/page-message";
import { TitledSection } from "@/components/ui/titled-section";
import { LocalitiesForm } from "@/features/coordinator/LocalitiesForm";
import { ScheduleForm } from "@/features/coordinator/ScheduleForm";
import { teamHref } from "@/features/coordinator/sections";
import { TrainingDetailsForm } from "@/features/coordinator/TrainingDetailsForm";
import { TrainingSitesForm } from "@/features/coordinator/TrainingSitesForm";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink, redirect } from "@/i18n/navigation";
import { loadCoordination, loadTrainingSetup } from "@/lib/coordinator";

import { saveLocalities, saveSchedule, saveTrainingDetails, saveTrainingSites } from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/setup">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.setup" });
  return { title: t("title") };
}

export default async function SetupPage({ params }: Props) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, th] = await Promise.all([
    getTranslations("coordinator.setup"),
    getTranslations("home"),
  ]);
  if (!coordination.data) return <PageMessage title={th("noTraining")} />;
  const setup = await loadTrainingSetup(coordination.supabase, coordination.data.training.id);

  return (
    <Stack gap="12" maxW="3xl">
      <PageHeading title={t("title")} subtitle={t("lead")} />
      <TrainingDetailsForm setup={setup} action={saveTrainingDetails.bind(null, setup.id)} />
      <ScheduleForm sessions={setup.sessions} action={saveSchedule.bind(null, setup.id)} />
      <LocalitiesForm localities={setup.localities} action={saveLocalities.bind(null, setup.id)} />
      <TrainingSitesForm sites={setup.sites} action={saveTrainingSites.bind(null, setup.id)} />
      <TitledSection title={t("coordinators")}>
        <Text color="fg.muted">{t("coordinatorsHelp")}</Text>
        <Button asChild variant="outline" color="fg" alignSelf="flex-start" mt="3">
          <LocaleLink href={teamHref}>{t("manageCoordinators")}</LocaleLink>
        </Button>
      </TitledSection>
    </Stack>
  );
}
