import { Flex, Link, Stack, Text } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeading } from "@/components/ui/page-heading";
import { PageMessage } from "@/components/ui/page-message";
import { PrintButton } from "@/components/ui/print-button";
import { groupBoard } from "@/features/coordinator/group-board";
import { NameTagSheet } from "@/features/coordinator/NameTagSheet";
import { sectionHref } from "@/features/coordinator/sections";
import { requireLocale } from "@/i18n/locale";
import { Link as LocaleLink, redirect } from "@/i18n/navigation";
import { loadCoordination } from "@/lib/coordinator";
import { loadStudyGroups } from "@/lib/groups";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/groups/name-tags">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.nameTags" });
  return { title: t("title") };
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

// One tag per seat, both names on a shared seat, in group order.
export default async function NameTagsPage({ params }: Props) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, tg, tc, th] = await Promise.all([
    getTranslations("coordinator.nameTags"),
    getTranslations("coordinator.groups"),
    getTranslations("coordinator"),
    getTranslations("home"),
  ]);
  const { data, supabase } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const board = groupBoard(data.registrations, await loadStudyGroups(supabase, data.training.id));
  const tags = [
    ...board.groups.flatMap((g) => g.members.toSorted(byName).map((m) => ({ m, group: g.number }))),
    ...board.unassigned.toSorted(byName).map((m) => ({ m, group: null })),
  ].map(({ m, group }) => ({
    id: m.id,
    names: m.names,
    meta: [
      m.locality,
      group === null ? null : tg("groupNumber", { number: group }),
      m.seat === "shared" ? tc("seatShort.shared") : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  return (
    <Stack gap="6">
      <Stack gap="4" _print={{ display: "none" }}>
        <Link asChild fontSize="sm" color="fg" textDecoration="underline" alignSelf="flex-start">
          <LocaleLink href={sectionHref("groups")}>{tg("title")}</LocaleLink>
        </Link>
        <Flex justify="space-between" align="flex-end" gap="4" wrap="wrap">
          <PageHeading title={t("title")} subtitle={t("lead", { count: tags.length })} />
          <PrintButton label={t("print")} />
        </Flex>
        <Text color="fg.muted">{t("howToPrint")}</Text>
      </Stack>
      <style>{"@page { size: A4; margin: 10mm 20mm; }"}</style>
      <NameTagSheet tags={tags} />
    </Stack>
  );
}
