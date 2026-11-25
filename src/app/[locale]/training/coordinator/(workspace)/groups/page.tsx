import { Button, Flex, HStack, SimpleGrid, Stack } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";

import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { groupBoard } from "@/features/coordinator/group-board";
import { nameTagsHref, sectionHref } from "@/features/coordinator/sections";
import { StudyGroupCard } from "@/features/coordinator/StudyGroupCard";
import { SuggestGroupsButton } from "@/features/coordinator/SuggestGroupsButton";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink } from "@/i18n/navigation";
import { loadStudyGroups } from "@/lib/groups";

import { requireActiveWorkspace } from "../workspace";
import { moveToStudyGroup, suggestStudyGroups } from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/groups">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.groups" });
  return { title: t("title") };
}

export default async function GroupsPage({ params }: Props) {
  const ws = await requireActiveWorkspace((await params).locale);
  if (!ws.ok) return ws.fallback;
  const { data, supabase } = ws.workspace;
  const [t, tl] = await Promise.all([
    getTranslations("coordinator.groups"),
    getTranslations("common.languages"),
  ]);

  const board = groupBoard(data.registrations, await loadStudyGroups(supabase, data.training.id));
  const label = (g: (typeof board.groups)[number]) =>
    `${t("groupNumber", { number: g.number })} · ${tl(g.language)}`;
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

      <SimpleGrid minChildWidth="64" gap="4" alignItems="start">
        {board.unassigned.length > 0 && hasGroups && (
          <StudyGroupCard
            title={t("unassigned")}
            meta={null}
            members={board.unassigned}
            targets={board.groups.map((g) => ({ id: g.id, label: label(g) }))}
            move={moveToStudyGroup}
            checkSize={false}
          />
        )}
        {board.groups.map((g) => (
          <StudyGroupCard
            key={g.id}
            title={t("groupNumber", { number: g.number })}
            meta={[tl(g.language), g.sites.join(", ") || g.localities.join(", ")]
              .filter(Boolean)
              .join(" · ")}
            members={g.members}
            targets={board.groups
              .filter((other) => other.id !== g.id)
              .map((other) => ({ id: other.id, label: label(other) }))}
            move={moveToStudyGroup}
            checkSize
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
