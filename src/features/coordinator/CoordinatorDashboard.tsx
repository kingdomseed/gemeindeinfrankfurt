import { Stack } from "@chakra-ui/react";
import { useLocale } from "next-intl";

import type { CoordinatorDashboard as Dashboard } from "@/lib/coordinator";
import { feesForRegistration, outlineStock, paymentTotals } from "@/lib/domain/payments";

import { CoordinatorHeader } from "./CoordinatorHeader";
import { OutlineOrders } from "./OutlineOrders";
import { PaymentStats } from "./PaymentStats";
import { RegistrationList } from "./RegistrationList";
import type { SetPaymentFlag } from "./types";

// The coordinator page: totals, outline orders and every registration.
export function CoordinatorDashboard(props: {
  data: Dashboard;
  actions: {
    signOut: () => Promise<void>;
    saveOutlineOrder: (form: FormData) => Promise<void>;
    setPaymentFlag: SetPaymentFlag;
  };
}) {
  const locale = useLocale();
  const { training, registrations, ordered } = props.data;
  const prices = { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents };
  const rows = registrations.map((registration) => ({
    registration,
    fees: feesForRegistration(registration, prices),
  }));
  const totals = paymentTotals(
    rows.map((r) => ({
      fees: r.fees,
      fee_paid: r.registration.fee_paid,
      outline_paid: r.registration.outline_paid,
    })),
  );

  return (
    <Stack gap="10">
      <CoordinatorHeader trainingTitle={training.title[locale]} signOut={props.actions.signOut} />
      <PaymentStats seats={rows.length} totals={totals} />
      <OutlineOrders
        trainingId={training.id}
        stock={outlineStock(registrations, ordered)}
        saveOrder={props.actions.saveOutlineOrder}
      />
      <RegistrationList rows={rows} setPaymentFlag={props.actions.setPaymentFlag} />
    </Stack>
  );
}
