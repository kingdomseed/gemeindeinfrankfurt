import { Link, Stack } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";

import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { AddCoordinatorForm } from "@/features/coordinator/AddCoordinatorForm";
import { sectionHref } from "@/features/coordinator/sections";
import { TeamList } from "@/features/coordinator/TeamList";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink } from "@/i18n/navigation";
import { isTeamAdmin, loadTeam } from "@/lib/team";

import { requireWorkspaceSession } from "../../workspace";
import {
  changeAdminRole,
  changeAvService,
  inviteCoordinator,
  removeTeamMember,
  resendSignInLink,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/setup/team">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.team" });
  return { title: t("title") };
}

export default async function TeamPage({ params }: Props) {
  const { supabase } = await requireWorkspaceSession((await params).locale);
  const [t, team, admin] = await Promise.all([
    getTranslations("coordinator.team"),
    loadTeam(supabase),
    isTeamAdmin(supabase),
  ]);

  return (
    <Stack gap="10">
      <Stack gap="2">
        <Link asChild fontSize="sm" color="fg" textDecoration="underline" alignSelf="flex-start">
          <LocaleLink href={sectionHref("setup")}>{t("backToSetup")}</LocaleLink>
        </Link>
        <PageHeading title={t("title")} subtitle={t("lead", { count: team.length })} />
      </Stack>
      <TeamList
        members={team}
        canManage={admin}
        actions={{
          resend: resendSignInLink,
          remove: removeTeamMember,
          av: changeAvService,
          admin: changeAdminRole,
        }}
      />
      {admin ? (
        <AddCoordinatorForm action={inviteCoordinator} />
      ) : (
        <Notice tone="neutral">{t("adminsOnly")}</Notice>
      )}
      <Notice tone="neutral">{t("removeNote")}</Notice>
    </Stack>
  );
}
