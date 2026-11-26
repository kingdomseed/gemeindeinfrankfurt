import { Button, Stack, Text } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";

import { PageHeading } from "@/components/ui/page-heading";
import { TitledSection } from "@/components/ui/titled-section";
import { ScheduleForm } from "@/features/coordinator/ScheduleForm";
import { teamHref } from "@/features/coordinator/sections";
import { SetupListForm } from "@/features/coordinator/SetupListForm";
import { TrainingDetailsForm } from "@/features/coordinator/TrainingDetailsForm";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink } from "@/i18n/navigation";
import { loadTrainingSetup } from "@/lib/coordinator";

import { requireActiveWorkspace } from "../workspace";
import { saveLocalities, saveSchedule, saveTrainingDetails, saveTrainingSites } from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/setup">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.setup" });
  return { title: t("title") };
}

export default async function SetupPage({ params }: Props) {
  const ws = await requireActiveWorkspace((await params).locale, "setup");
  if (!ws.ok) return ws.fallback;
  const { data, supabase } = ws.workspace;
  const [t, setup] = await Promise.all([
    getTranslations("coordinator.setup"),
    loadTrainingSetup(supabase, data.training.id),
  ]);

  return (
    <Stack gap="12" maxW="3xl">
      <PageHeading title={t("title")} subtitle={t("lead")} />
      <TrainingDetailsForm setup={setup} action={saveTrainingDetails.bind(null, setup.id)} />
      <ScheduleForm sessions={setup.sessions} action={saveSchedule.bind(null, setup.id)} />
      <SetupListForm
        legend={t("localities")}
        help={t("localitiesHelp")}
        addLabel={t("addLocality")}
        items={setup.localities.map((l) => ({
          id: l.id,
          name: l.name,
          used: l.used,
          removable: !l.is_home && l.used === 0,
        }))}
        action={saveLocalities.bind(null, setup.id)}
      />
      <SetupListForm
        legend={t("sites")}
        help={t("sitesHelp")}
        addLabel={t("addSite")}
        items={setup.sites.map((s) => ({
          id: s.id,
          name: s.name,
          used: s.used,
          removable: setup.sites.length > 1 && s.used === 0,
        }))}
        action={saveTrainingSites.bind(null, setup.id)}
      />
      <TitledSection title={t("coordinators")}>
        <Text color="fg.muted">{t("coordinatorsHelp")}</Text>
        <Button asChild variant="outline" color="fg" alignSelf="flex-start" mt="3">
          <LocaleLink href={teamHref}>{t("manageCoordinators")}</LocaleLink>
        </Button>
      </TitledSection>
    </Stack>
  );
}
