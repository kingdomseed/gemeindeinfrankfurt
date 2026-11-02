import { SimpleGrid } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { StatCard } from "@/components/ui/stat-card";
import { formatEuro } from "@/lib/domain/fees";
import type { PaymentTotals } from "@/lib/domain/payments";

export function PaymentStats({ seats, totals }: { seats: number; totals: PaymentTotals }) {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  const euro = (c: number) => formatEuro(c, locale);
  return (
    <SimpleGrid columns={{ base: 2, sm: 4 }} gap="3">
      <StatCard label={t("seats")} value={String(seats)} />
      <StatCard label={t("feesReceived")} value={euro(totals.feesReceived)} />
      <StatCard label={t("outlinesReceived")} value={euro(totals.outlinesReceived)} />
      <StatCard label={t("unpaid")} value={euro(totals.unpaid)} />
    </SimpleGrid>
  );
}
