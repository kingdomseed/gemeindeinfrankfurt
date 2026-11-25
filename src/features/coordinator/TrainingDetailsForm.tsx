"use client";

import { Button, chakra, Input, SimpleGrid } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import type { TrainingSetup } from "@/lib/coordinator";
import { toBerlinWallTime } from "@/lib/domain/berlin-time";

import { FormResult } from "./FormResult";
import type { FormAction, FormState } from "./types";

const euroInput = (cents: number) => (cents / 100).toFixed(2);

// The training's name, money and payment details, and the outline deadline.
export function TrainingDetailsForm(props: { setup: TrainingSetup; action: FormAction }) {
  const t = useTranslations("coordinator.setup");
  const tl = useTranslations("common.languages");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.action, {
    status: "idle",
  });
  const s = props.setup;
  const deadline = s.outline_order_deadline
    ? toBerlinWallTime(new Date(s.outline_order_deadline))
    : null;
  return (
    <chakra.form
      action={formAction}
      key={s.updated_at}
      display="flex"
      flexDirection="column"
      gap="10"
    >
      <FormSection legend={t("name")}>
        {(["de", "en", "ru"] as const).map((l) => (
          <FormField key={l} label={tl(l)} required>
            <Input name={`title_${l}`} lang={l} defaultValue={s.title[l]} />
          </FormField>
        ))}
      </FormSection>
      <FormSection legend={t("money")}>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
          <FormField label={t("fee")} help={t("feeHelp")} required>
            <Input name="fee" inputMode="decimal" defaultValue={euroInput(s.fee_cents)} />
          </FormField>
          <FormField label={t("outlinePrice")} required>
            <Input
              name="outline_price"
              inputMode="decimal"
              defaultValue={euroInput(s.outline_price_cents)}
            />
          </FormField>
          <FormField label={t("payee")} required>
            <Input name="payee_name" defaultValue={s.payee_name} />
          </FormField>
          <FormField label={t("iban")} required>
            <Input
              name="payee_iban"
              fontFamily="mono"
              spellCheck={false}
              defaultValue={s.payee_iban}
            />
          </FormField>
          <FormField label={t("reference")} required>
            <Input name="payment_reference" defaultValue={s.payment_reference} />
          </FormField>
        </SimpleGrid>
      </FormSection>
      <FormSection legend={t("placeAndOrder")}>
        <FormField label={t("venue")} required>
          <Input name="venue" defaultValue={s.venue} />
        </FormField>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
          <FormField label={t("outlineDeadlineDate")} help={t("outlineDeadlineHelp")}>
            <Input name="deadline_date" type="date" defaultValue={deadline?.date ?? ""} />
          </FormField>
          <FormField label={t("outlineDeadlineTime")}>
            <Input name="deadline_time" type="time" defaultValue={deadline?.time ?? "16:00"} />
          </FormField>
        </SimpleGrid>
      </FormSection>
      <Button type="submit" alignSelf="flex-start" loading={pending}>
        {t("saveDetails")}
      </Button>
      <FormResult state={state} saved={t("saved")} />
    </chakra.form>
  );
}
