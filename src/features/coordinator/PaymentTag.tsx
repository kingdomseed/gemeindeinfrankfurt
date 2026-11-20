import { useTranslations } from "next-intl";

import { StatusTag } from "@/components/ui/status-tag";

import type { RegistrationRow } from "./types";

// The state of one payment of a registration, as a read-only tag.
export function PaymentTag({ row, payment }: { row: RegistrationRow; payment: "fee" | "outline" }) {
  const t = useTranslations("coordinator");
  const { registration: r, fees } = row;
  if (payment === "fee" && fees.waived) {
    const live = r.seat_type === "anaheim" || r.waiver === "anaheim";
    return <StatusTag tone="brand">{live ? t("waivedAnaheim") : t("waivedHardship")}</StatusTag>;
  }
  if (payment === "outline" && fees.outlineCount === 0) {
    return <StatusTag>{t("none")}</StatusTag>;
  }
  const paid = payment === "fee" ? r.fee_paid : r.outline_paid;
  return (
    <StatusTag tone={paid ? "success" : "warning"}>{paid ? t("paid") : t("notPaid")}</StatusTag>
  );
}
