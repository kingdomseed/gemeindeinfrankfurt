"use client";

import { Button, chakra, Heading, Input, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useTransition, type SyntheticEvent } from "react";

import { FormField } from "@/components/ui/form-field";
import { Notice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { SelectField } from "@/components/ui/select-field";
import type { RegistrationDetail } from "@/lib/coordinator";
import { formatEuro, type FeeBreakdown } from "@/lib/domain/fees";

import { PaymentFields } from "./PaymentFields";
import type { FormState } from "./types";

// The only place a payment is marked: one form for the donation, the outlines
// and the donation waiver.
export function PaymentPanel(props: {
  registration: RegistrationDetail["registration"];
  fees: FeeBreakdown;
  action: (prev: FormState, form: FormData) => Promise<FormState>;
}) {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  const [, startTransition] = useTransition();
  const { registration: r, fees } = props;
  // Sent through a transition so React does not reset the fields afterwards;
  // each payment's fields remount (see `key`) once its stored values change.
  function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(() => formAction(form));
  }
  const euro = (cents: number) => formatEuro(cents, locale);

  if (r.seat_type === "anaheim") {
    return (
      <Panel tone="neutral" aria-labelledby="payment-heading">
        <Heading as="h2" id="payment-heading" size="xl">
          {t("paymentTitle")}
        </Heading>
        <Text mt="2">{t("nothingOwed")}</Text>
      </Panel>
    );
  }

  return (
    <Panel tone="brand" aria-labelledby="payment-heading">
      <chakra.form onSubmit={onSubmit} display="flex" flexDirection="column" gap="5">
        <Heading as="h2" id="payment-heading" size="xl">
          {t("paymentTitle")}
        </Heading>
        {!fees.waived && (
          <PaymentFields
            key={`${r.fee_paid}|${r.fee_paid_on}|${r.fee_transaction}`}
            name="fee"
            label={`${t("donationReceived")} · ${euro(fees.trainingCents)}`}
            paid={r.fee_paid}
            paidOn={r.fee_paid_on}
            transaction={r.fee_transaction}
          />
        )}
        {fees.outlineCount > 0 && (
          <PaymentFields
            key={`${r.outline_paid}|${r.outline_paid_on}|${r.outline_transaction}`}
            name="outline"
            label={`${t("outlinesReceivedCount", { count: fees.outlineCount })} · ${euro(fees.outlineCents)}`}
            paid={r.outline_paid}
            paidOn={r.outline_paid_on}
            transaction={r.outline_transaction}
          />
        )}
        <SelectField label={t("waiver")} field={{ name: "waiver", defaultValue: r.waiver ?? "" }}>
          <option value="">{t("waiverNone")}</option>
          <option value="hardship">{t("waiverHardship")}</option>
          {r.waiver === "anaheim" && <option value="anaheim">{t("waiverAnaheim")}</option>}
        </SelectField>
        <FormField
          label={t("waiverReason")}
          optionalLabel={t("optional")}
          help={t("waiverReasonHelp")}
        >
          <Input name="waiver_reason" defaultValue={r.waiver_reason} maxLength={500} />
        </FormField>
        <Text fontSize="sm" color="fg.muted">
          {t("paymentHelp")}
        </Text>
        {!pending && state.status !== "idle" && (
          <Notice
            tone={state.status === "saved" ? "success" : "warning"}
            announce={state.status === "saved" ? "status" : "alert"}
            focus
          >
            {state.status === "saved" ? t("paymentSaved") : t("error")}
          </Notice>
        )}
        <Button type="submit" alignSelf="flex-start" px="6" disabled={pending}>
          {t("savePayment")}
        </Button>
      </chakra.form>
    </Panel>
  );
}
