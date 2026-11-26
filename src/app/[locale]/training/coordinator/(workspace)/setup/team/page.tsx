import { Link, Stack } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";

import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { AddCoordinatorForm } from "@/features/coordinator/AddCoordinatorForm";
import { RoleTabAccessForm } from "@/features/coordinator/RoleTabAccessForm";
import { sectionHref } from "@/features/coordinator/sections";
import { TeamList } from "@/features/coordinator/TeamList";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink } from "@/i18n/navigation";
import { loadTeam } from "@/lib/team";

import { requireSectionSession } from "../../workspace";
import {
  changeAvService,
  changeMemberRole,
  inviteCoordinator,
  removeTeamMember,
  resendSignInLink,
  saveTabPermissions,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/setup/team">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.team" });
  return { title: t("title") };
}

export default async function TeamPage({ params }: Props) {
  const res = await requireSectionSession((await params).locale, "setup");
  if (!res.ok) return res.fallback;
  const { supabase, currentUser, permissions } = res.session;
  const admin = currentUser.isAdmin;
  const [t, team] = await Promise.all([getTranslations("coordinator.team"), loadTeam(supabase)]);

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
          role: changeMemberRole,
        }}
      />
      {admin ? (
        <>
          <RoleTabAccessForm permissions={permissions} action={saveTabPermissions} />
          <AddCoordinatorForm action={inviteCoordinator} />
        </>
      ) : (
        <Notice tone="neutral">{t("adminsOnly")}</Notice>
      )}
      <Notice tone="neutral">{t("removeNote")}</Notice>
    </Stack>
  );
}
