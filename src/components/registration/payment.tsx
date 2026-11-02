"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { fieldClass } from "@/components/styles";
import { formatEuro, type FeeBreakdown } from "@/lib/domain/fees";

export type PaymentDetails = { payee: string; iban: string; reference: string };

export function PaymentSummary(props: {
  fees: FeeBreakdown;
  payment: PaymentDetails;
  payerName?: string | undefined;
}) {
  const t = useTranslations("register");
  const locale = useLocale();
  const euro = (cents: number) => formatEuro(cents, locale);
  const { fees } = props;
  return (
    <section aria-labelledby="payment-heading" className="rounded-xl bg-brand-soft p-5">
      <h2 id="payment-heading" className="text-lg font-semibold">
        {t("sectionPayment")}
      </h2>
      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 tabular-nums">
        <dt>{t("trainingFee")}</dt>
        <dd className="text-right">
          {fees.waived && <span className="text-sm text-muted">{t("waived")} </span>}
          {euro(fees.trainingCents)}
        </dd>
        <dt>{t("outlines", { count: fees.outlineCount })}</dt>
        <dd className="text-right">{euro(fees.outlineCents)}</dd>
      </dl>
      <dl className="mt-2 flex items-baseline justify-between border-t border-line-strong pt-2 font-semibold tabular-nums">
        <dt>{t("total")}</dt>
        <dd className="text-lg">{euro(fees.trainingCents + fees.outlineCents)}</dd>
      </dl>
      <p className="mt-4 text-sm text-muted">{t("payHint")}</p>
      <TransferDetails payment={props.payment} />
      <label className="mt-4 block">
        {t("payerName")} <span className="text-sm text-muted">({t("optional")})</span>
        <span className="block text-sm text-muted">{t("payerNameHelp")}</span>
        <input
          name="payer_name"
          defaultValue={props.payerName}
          autoComplete="off"
          className={fieldClass}
        />
      </label>
    </section>
  );
}

export function TransferDetails({ payment }: { payment: PaymentDetails }) {
  const t = useTranslations("register");
  return (
    <dl className="mt-2 grid gap-y-2 sm:grid-cols-[auto_1fr] sm:gap-x-6">
      <dt className="text-sm text-muted">{t("payee")}</dt>
      <dd>{payment.payee}</dd>
      <dt className="text-sm text-muted">{t("iban")}</dt>
      <dd className="flex flex-wrap items-center gap-x-3">
        <span className="font-mono tabular-nums select-all">{payment.iban}</span>
        <CopyButton value={payment.iban.replaceAll(/\s/g, "")} />
      </dd>
      <dt className="text-sm text-muted">{t("reference")}</dt>
      <dd className="flex flex-wrap items-center gap-x-3">
        <span className="select-all">{payment.reference}</span>
        <CopyButton value={payment.reference} />
      </dd>
    </dl>
  );
}

function CopyButton({ value }: { value: string }) {
  const t = useTranslations("register");
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return; // clipboard blocked: the value stays selectable by hand
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="min-h-8 rounded-md border border-line-strong px-2 text-sm hover:bg-background"
    >
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
}
