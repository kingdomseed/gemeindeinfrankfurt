import { HStack, Link, Stack, Text } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import { StatusTag } from "@/components/ui/status-tag";
import { Link as LocaleLink } from "@/i18n/navigation";
import type { RegistrationDetail } from "@/lib/coordinator";

import { displayName } from "./display";

// The top of a registration's page: the way back, who it is and its seat.
export function RegistrationHeading({
  registration: r,
}: {
  registration: RegistrationDetail["registration"];
}) {
  const t = useTranslations("coordinator");
  const format = useFormatter();
  const registered = format.dateTime(new Date(r.created_at), { dateStyle: "medium" });
  return (
    <Stack gap="3">
      <Link asChild alignSelf="flex-start" fontSize="sm" textDecoration="underline" color="fg">
        <LocaleLink href="/training/coordinator">← {t("allRegistrations")}</LocaleLink>
      </Link>
      <PageHeading title={displayName(r)} subtitle={r.email} />
      <HStack wrap="wrap" gap="2">
        <StatusTag tone="brand">{t(`seatShort.${r.seat_type}`)}</StatusTag>
        {r.status === "cancelled" && <StatusTag tone="error">{t("cancelledTag")}</StatusTag>}
        <Text as="span" fontSize="sm" color="fg.muted">
          {t("registeredOn", { date: registered })}
        </Text>
      </HStack>
    </Stack>
  );
}
