"use client";

import { Button, chakra, Heading, Input, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { SelectField } from "@/components/ui/select-field";
import { formatEuro, type FeeBreakdown } from "@/lib/domain/fees";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import type { PaymentRecord } from "./payment-record";
import { PaymentFields } from "./PaymentFields";
import type { FormAction } from "./types";
import { useCollaborativeForm } from "./useCollaborativeForm";

type PaymentDraft = {
  fee_paid: string;
  fee_paid_on: string;
  fee_transaction: string;
  outline_paid: string;
  outline_paid_on: string;
  outline_transaction: string;
  waiver: string;
  waiver_reason: string;
};

function toPaymentDraft(r: PaymentRecord): PaymentDraft {
  return {
    fee_paid: r.fee_paid ? "on" : "",
    fee_paid_on: r.fee_paid_on ?? "",
    fee_transaction: r.fee_transaction,
    outline_paid: r.outline_paid ? "on" : "",
    outline_paid_on: r.outline_paid_on ?? "",
    outline_transaction: r.outline_transaction,
    waiver: r.waiver ?? "",
    waiver_reason: r.waiver_reason,
  };
}

// The only place a payment is marked: one form for the donation, the outlines
// and the donation waiver.
export function PaymentPanel(props: {
  registration: PaymentRecord;
  fees: FeeBreakdown;
  action: FormAction;
}) {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  const { registration: r, fees } = props;
  const server = toPaymentDraft(r);
  const collab = useCollaborativeForm({
    server,
    version: r.payment_updated_at,
    action: props.action,
  });
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

  const fieldLabels = {
    fee_paid: t("donation"),
    fee_paid_on: t("dateReceived"),
    fee_transaction: t("transaction"),
    outline_paid: t("outlines"),
    outline_paid_on: t("dateReceived"),
    outline_transaction: t("transaction"),
    waiver: t("waiver"),
    waiver_reason: t("waiverReason"),
  };

  return (
    <Panel tone="brand" aria-labelledby="payment-heading">
      <chakra.form onSubmit={collab.submit} display="flex" flexDirection="column" gap="5">
        <Heading as="h2" id="payment-heading" size="xl">
          {t("paymentTitle")}
        </Heading>
        {!fees.waived && (
          <PaymentFields
            name="fee"
            label={`${t("donationReceived")} · ${euro(fees.trainingCents)}`}
            paid={collab.draft.fee_paid === "on"}
            paidOn={collab.draft.fee_paid_on}
            transaction={collab.draft.fee_transaction}
            onPaidChange={(checked) => collab.edit("fee_paid", checked ? "on" : "")}
            onPaidOnChange={(v) => collab.edit("fee_paid_on", v)}
            onTransactionChange={(v) => collab.edit("fee_transaction", v)}
          />
        )}
        {fees.outlineCount > 0 && (
          <PaymentFields
            name="outline"
            label={`${t("outlinesReceivedCount", { count: fees.outlineCount })} · ${euro(fees.outlineCents)}`}
            paid={collab.draft.outline_paid === "on"}
            paidOn={collab.draft.outline_paid_on}
            transaction={collab.draft.outline_transaction}
            onPaidChange={(checked) => collab.edit("outline_paid", checked ? "on" : "")}
            onPaidOnChange={(v) => collab.edit("outline_paid_on", v)}
            onTransactionChange={(v) => collab.edit("outline_transaction", v)}
          />
        )}
        <SelectField
          label={t("waiver")}
          field={{
            name: "waiver",
            value: collab.draft.waiver,
            onChange: (e) => collab.edit("waiver", e.currentTarget.value),
          }}
        >
          <option value="">{t("waiverNone")}</option>
          <option value="hardship">{t("waiverHardship")}</option>
          {r.waiver === "anaheim" && <option value="anaheim">{t("waiverAnaheim")}</option>}
        </SelectField>
        <FormField
          label={t("waiverReason")}
          optionalLabel={t("optional")}
          help={t("waiverReasonHelp")}
        >
          <Input
            name="waiver_reason"
            value={collab.draft.waiver_reason}
            onChange={(e) => collab.edit("waiver_reason", e.currentTarget.value)}
            maxLength={500}
          />
        </FormField>
        <Text fontSize="sm" color="fg.muted">
          {t("paymentHelp")}
        </Text>
        <ConflictBanner {...collab.bannerProps} fieldLabels={fieldLabels} />
        <FormResult state={collab.result} saved={t("paymentSaved")} focus errorTone="warning" />
        <Button type="submit" alignSelf="flex-start" px="6" disabled={collab.pending}>
          {t("savePayment")}
        </Button>
      </chakra.form>
    </Panel>
  );
}
