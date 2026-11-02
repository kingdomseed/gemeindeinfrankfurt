import { Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { formatEuro } from "@/lib/domain/fees";

import { displayName } from "./display";
import { PaymentToggle } from "./PaymentToggle";
import type { RegistrationRow, SetPaymentFlag } from "./types";

// One payment of a registration: the fee or the outlines. A waived fee shows
// as text; anything else is a toggle. `showLabel` adds the visible label and
// amount, for the phone cards where there is no column header.
export function PaymentStatus(props: {
  row: RegistrationRow;
  payment: "fee" | "outline";
  setPaymentFlag: SetPaymentFlag;
  showLabel?: boolean;
}) {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  const { registration: r, fees } = props.row;
  if (props.payment === "fee" && fees.waived) {
    return (
      <Text
        as="span"
        display="inline-flex"
        minH="11"
        alignItems="center"
        fontSize="sm"
        color="fg.muted"
      >
        {t("waived")}
      </Text>
    );
  }
  const isFee = props.payment === "fee";
  const label = isFee ? t("feePaid") : t("outlinePaid");
  const cents = isFee ? fees.trainingCents : fees.outlineCents;
  return (
    <PaymentToggle
      id={r.id}
      field={isFee ? "fee_paid" : "outline_paid"}
      value={isFee ? r.fee_paid : r.outline_paid}
      setPaymentFlag={props.setPaymentFlag}
      label={`${label}: ${displayName(props.row)}`}
      visibleLabel={props.showLabel ? `${label} · ${formatEuro(cents, locale)}` : undefined}
      failedLabel={t("saveFailed")}
    />
  );
}
