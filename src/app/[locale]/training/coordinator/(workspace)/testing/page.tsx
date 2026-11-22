import { Box, Flex, List, Stack, Text } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeading } from "@/components/ui/page-heading";
import { PageMessage } from "@/components/ui/page-message";
import { PrintButton } from "@/components/ui/print-button";
import { TestSlotSelect } from "@/features/coordinator/TestSlotSelect";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadCoordination } from "@/lib/coordinator";
import { berlinDayTime } from "@/lib/domain/sessions";
import { loadStudyGroups } from "@/lib/groups";
import { loadTestSchedule } from "@/lib/testing";

import { saveTestSlot } from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/testing">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.testing" });
  return { title: t("title") };
}

export default async function TestingPage({ params }: Props) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, tg, th, tl] = await Promise.all([
    getTranslations("coordinator.testing"),
    getTranslations("coordinator.groups"),
    getTranslations("home"),
    getTranslations("common.languages"),
  ]);
  const { data, supabase } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const [schedule, groups] = await Promise.all([
    loadTestSchedule(supabase, data.training.id),
    loadStudyGroups(supabase, data.training.id),
  ]);
  const options = groups.map((g) => ({
    id: g.id,
    label: `${tg("groupNumber", { number: g.number })} · ${tl(g.language)}`,
  }));
  const planned = schedule.filter((s) => s.groupId).length;

  return (
    <Stack gap="8" maxW="3xl">
      <Flex justify="space-between" align="flex-end" gap="4" wrap="wrap">
        <PageHeading title={t("title")} subtitle={t("planned", { count: planned })} />
        <Box _print={{ display: "none" }}>
          <PrintButton label={t("print")} />
        </Box>
      </Flex>
      <Text color="fg.muted">{groups.length > 0 ? t("lead") : t("noGroups")}</Text>
      <List.Root as="ol" listStyle="none" borderTopWidth="1px">
        {schedule.map((s) => (
          <List.Item
            key={s.sessionId}
            display="grid"
            gridTemplateColumns={{ base: "1fr", sm: "minmax(0, 1fr) minmax(12rem, 16rem)" }}
            alignItems="center"
            columnGap="6"
            rowGap="2"
            py="2"
            px="2"
            borderBottomWidth="1px"
            bg={s.groupId ? "brand.subtle" : undefined}
          >
            <Stack gap="0">
              <Text fontWeight="medium">{t("message", { number: s.messageNumber })}</Text>
              <Text fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
                {berlinDayTime(new Date(s.startsAt), locale, th("lordsDay"))}
              </Text>
            </Stack>
            <TestSlotSelect
              key={s.groupId ?? "none"}
              sessionId={s.sessionId}
              messageNumber={s.messageNumber}
              groupId={s.groupId}
              groups={options}
              save={saveTestSlot}
            />
          </List.Item>
        ))}
      </List.Root>
    </Stack>
  );
}
