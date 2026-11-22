import { Heading, HStack, Stack } from "@chakra-ui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { PageMessage } from "@/components/ui/page-message";
import { StatusTag } from "@/components/ui/status-tag";
import { ServiceList } from "@/features/coordinator/ServiceList";
import { WebcastLogin } from "@/features/coordinator/WebcastLogin";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadCoordination } from "@/lib/coordinator";
import { loadServices } from "@/lib/services";

import {
  addService,
  removeService,
  setServiceLead,
  showWebcastPassword,
  updateWebcastLogin,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/services">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.services" });
  return { title: t("title") };
}

export default async function ServicesPage({ params }: Props) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const [t, th] = await Promise.all([
    getTranslations("coordinator.services"),
    getTranslations("home"),
  ]);
  const { data, supabase } = coordination;
  if (!data) return <PageMessage title={th("noTraining")} />;

  const trainingId = data.training.id;
  const page = await loadServices(supabase, trainingId);
  const registrants = data.registrations
    .filter((r) => r.status === "active")
    .flatMap((r) =>
      r.seat_type === "shared"
        ? [`${r.first_name} ${r.last_name}`, `${r.partner_first_name} ${r.partner_last_name}`]
        : [`${r.first_name} ${r.last_name}`],
    );
  const people = [...new Set([...page.coordinatorNames, ...registrants])].toSorted((a, b) =>
    a.localeCompare(b, locale),
  );

  return (
    <Stack gap="10" maxW="3xl">
      <PageHeading title={t("title")} subtitle={t("lead")} />
      <Stack as="section" aria-labelledby="services-heading" gap="3">
        <Heading as="h2" id="services-heading" size="xl">
          {t("listTitle")}
        </Heading>
        <ServiceList
          services={page.services}
          people={people}
          actions={{
            setLead: setServiceLead,
            add: addService.bind(null, trainingId),
            remove: removeService,
          }}
        />
      </Stack>
      <Stack as="section" aria-labelledby="webcast-heading" gap="3">
        <HStack gap="3" wrap="wrap">
          <Heading as="h2" id="webcast-heading" size="xl">
            {t("webcastTitle")}
          </Heading>
          <StatusTag tone="brand">{t("avOnly")}</StatusTag>
        </HStack>
        {page.servesAv ? (
          <WebcastLogin
            login={page.login}
            reveal={showWebcastPassword.bind(null, trainingId)}
            save={updateWebcastLogin.bind(null, trainingId)}
          />
        ) : (
          <Notice tone="neutral">
            {page.avNames.length > 0
              ? t("notAv", { names: page.avNames.join(", ") })
              : t("notAvNobody")}
          </Notice>
        )}
      </Stack>
    </Stack>
  );
}
