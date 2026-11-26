import { Button, Flex, HStack, Stack } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";

import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { AddGroupButton } from "@/features/coordinator/AddGroupButton";
import { groupBoard } from "@/features/coordinator/group-board";
import { GroupsBoard } from "@/features/coordinator/GroupsBoard";
import { nameTagsHref, sectionHref } from "@/features/coordinator/sections";
import { SuggestGroupsButton } from "@/features/coordinator/SuggestGroupsButton";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink } from "@/i18n/navigation";
import { loadStudyGroups } from "@/lib/groups";

import { requireActiveWorkspace } from "../workspace";
import {
  addEmptyStudyGroup,
  changeStudyGroupLanguage,
  moveToStudyGroup,
  removeEmptyStudyGroup,
  suggestStudyGroups,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/groups">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.groups" });
  return { title: t("title") };
}

export default async function GroupsPage({ params }: Props) {
  const ws = await requireActiveWorkspace((await params).locale, "groups");
  if (!ws.ok) return ws.fallback;
  const { data, supabase } = ws.workspace;
  const t = await getTranslations("coordinator.groups");

  const board = groupBoard(data.registrations, await loadStudyGroups(supabase, data.training.id));
  const hasGroups = board.groups.length > 0;

  return (
    <Stack gap="8">
      <Flex justify="space-between" align="flex-end" gap="4" wrap="wrap">
        <PageHeading
          title={t("title")}
          subtitle={t("summary", {
            people: board.people,
            groups: board.groups.length,
            unassigned: board.unassigned.length,
          })}
        />
        <HStack gap="3" wrap="wrap">
          <AddGroupButton add={addEmptyStudyGroup.bind(null, data.training.id)} />
          <SuggestGroupsButton
            hasGroups={hasGroups}
            suggest={suggestStudyGroups.bind(null, data.training.id)}
          />
          {hasGroups && (
            <>
              <Button asChild variant="outline" color="fg">
                <LocaleLink href={nameTagsHref}>{t("nameTags")}</LocaleLink>
              </Button>
              <Button asChild>
                <LocaleLink href={sectionHref("testing")}>{t("planTesting")}</LocaleLink>
              </Button>
            </>
          )}
        </HStack>
      </Flex>

      <Notice tone="neutral">{hasGroups ? t("howSuggested") : t("noGroups")}</Notice>

      {hasGroups && (
        <GroupsBoard
          groups={board.groups}
          unassigned={board.unassigned}
          move={moveToStudyGroup}
          changeLanguage={changeStudyGroupLanguage.bind(null, data.training.id)}
          removeEmpty={removeEmptyStudyGroup.bind(null, data.training.id)}
        />
      )}
    </Stack>
  );
}
