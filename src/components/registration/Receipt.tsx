"use client";

import { useLocale, useTranslations } from "next-intl";

import { formatEuro } from "@/lib/domain/fees";

import { focusOnMount } from "./focus";
import { TransferDetails, type PaymentDetails } from "./payment";

// Shown after a successful registration, so the transfer details stay on screen
// even if the confirmation email lands in spam.
export function Receipt(props: {
  totalCents: number;
  payment: PaymentDetails;
  onRegisterAnother: () => void;
}) {
  const t = useTranslations("register");
  const locale = useLocale();
  return (
    <section
      ref={focusOnMount}
      tabIndex={-1}
      className="space-y-4 rounded-xl bg-success-bg p-5 text-success-ink outline-none"
    >
      <h2 className="text-xl font-semibold">{t("receiptTitle")}</h2>
      <p>{t("receiptBody")}</p>
      {props.totalCents > 0 && (
        <div className="rounded-lg bg-background p-4 text-foreground">
          <p className="font-semibold">
            {t("receiptPay", { total: formatEuro(props.totalCents, locale) })}
          </p>
          <TransferDetails payment={props.payment} />
        </div>
      )}
      <button type="button" onClick={props.onRegisterAnother} className="font-semibold underline">
        {t("registerAnother")}
      </button>
    </section>
  );
}
