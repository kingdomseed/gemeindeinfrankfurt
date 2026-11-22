import { SimpleGrid } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { StatCard } from "@/components/ui/stat-card";
import { formatEuro } from "@/lib/domain/fees";
import { seatTypes } from "@/lib/domain/types";

import type { Summary } from "./summary";

// Seats and money received so far. `detailed` adds the counts under each figure.
export function PaymentStats({ summary, detailed }: { summary: Summary; detailed?: boolean }) {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  const euro = (c: number) => formatEuro(c, locale);
  const { seats, totals, counts } = summary;
  const help = (parts: (string | false)[]) =>
    detailed ? parts.filter((p) => p !== false).join(" · ") : undefined;
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="3">
      <StatCard
        label={t("seats")}
        value={String(summary.active.length)}
        help={help(seatTypes.map((s) => seats[s] > 0 && t(`seatCount.${s}`, { count: seats[s] })))}
      />
      <StatCard
        label={t("feesReceived")}
        value={euro(totals.feesReceived)}
        help={help([
          t("paidOf", { paid: counts.feePaid, owed: counts.feeOwed }),
          counts.waived > 0 && t("waivedCount", { count: counts.waived }),
          counts.owesNothing > 0 && t("owesNothingCount", { count: counts.owesNothing }),
        ])}
      />
      <StatCard
        label={t("outlinesReceived")}
        value={euro(totals.outlinesReceived)}
        help={help([t("outlinesPaidOf", { paid: counts.outlinesPaid, owed: counts.outlinesOwed })])}
      />
      <StatCard
        label={t("unpaid")}
        value={euro(totals.unpaid)}
        help={help([t("registrationCount", { count: counts.unpaidRegistrations })])}
      />
    </SimpleGrid>
  );
}
