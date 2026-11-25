"use client";

import { Button, chakra, Input, SimpleGrid, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import type { TrainingSetup } from "@/lib/coordinator";
import { toBerlinWallTime } from "@/lib/domain/berlin-time";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import type { FormAction } from "./types";
import { useCollaborativeForm } from "./useCollaborativeForm";

const euroInput = (cents: number) => (cents / 100).toFixed(2);

type DetailsDraft = {
  title_de: string;
  title_en: string;
  title_ru: string;
  fee: string;
  outline_price: string;
  payee_name: string;
  payee_iban: string;
  payment_reference: string;
  venue: string;
  deadline_date: string;
  deadline_time: string;
};

function toDetailsDraft(s: TrainingSetup): DetailsDraft {
  const deadline = s.outline_order_deadline
    ? toBerlinWallTime(new Date(s.outline_order_deadline))
    : null;
  return {
    title_de: s.title.de,
    title_en: s.title.en,
    title_ru: s.title.ru,
    fee: euroInput(s.fee_cents),
    outline_price: euroInput(s.outline_price_cents),
    payee_name: s.payee_name,
    payee_iban: s.payee_iban,
    payment_reference: s.payment_reference,
    venue: s.venue,
    deadline_date: deadline?.date ?? "",
    deadline_time: deadline?.time ?? "16:00",
  };
}

// The training's name, money and payment details, and the outline deadline.
export function TrainingDetailsForm(props: { setup: TrainingSetup; action: FormAction }) {
  const t = useTranslations("coordinator.setup");
  const tl = useTranslations("common.languages");
  const s = props.setup;
  const collab = useCollaborativeForm({
    server: toDetailsDraft(s),
    version: s.updated_at,
    action: props.action,
  });

  const fieldLabels = {
    title_de: `${t("name")} (${tl("de")})`,
    title_en: `${t("name")} (${tl("en")})`,
    title_ru: `${t("name")} (${tl("ru")})`,
    fee: t("fee"),
    outline_price: t("outlinePrice"),
    payee_name: t("payee"),
    payee_iban: t("iban"),
    payment_reference: t("reference"),
    venue: t("venue"),
    deadline_date: t("outlineDeadlineDate"),
    deadline_time: t("outlineDeadlineTime"),
  };

  return (
    <chakra.form onSubmit={collab.submit} display="flex" flexDirection="column" gap="10">
      <FormSection legend={t("name")}>
        {(["de", "en", "ru"] as const).map((l) => {
          const field = `title_${l}` as const;
          return (
            <FormField key={l} label={tl(l)} required>
              <Input
                name={field}
                lang={l}
                value={collab.draft[field]}
                onChange={(e) => collab.edit(field, e.currentTarget.value)}
              />
            </FormField>
          );
        })}
      </FormSection>
      <FormSection legend={t("money")}>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
          <FormField label={t("fee")} help={t("feeHelp")} required>
            <Input
              name="fee"
              inputMode="decimal"
              fontVariantNumeric="tabular-nums"
              value={collab.draft.fee}
              onChange={(e) => collab.edit("fee", e.currentTarget.value)}
            />
          </FormField>
          <FormField label={t("outlinePrice")} required>
            <Input
              name="outline_price"
              inputMode="decimal"
              fontVariantNumeric="tabular-nums"
              value={collab.draft.outline_price}
              onChange={(e) => collab.edit("outline_price", e.currentTarget.value)}
            />
          </FormField>
          <FormField label={t("payee")} required>
            <Input
              name="payee_name"
              value={collab.draft.payee_name}
              onChange={(e) => collab.edit("payee_name", e.currentTarget.value)}
            />
          </FormField>
          <FormField label={t("iban")} required>
            <Input
              name="payee_iban"
              fontFamily="mono"
              spellCheck={false}
              value={collab.draft.payee_iban}
              onChange={(e) => collab.edit("payee_iban", e.currentTarget.value)}
            />
          </FormField>
        </SimpleGrid>
        <FormField label={t("reference")} required>
          <Input
            name="payment_reference"
            value={collab.draft.payment_reference}
            onChange={(e) => collab.edit("payment_reference", e.currentTarget.value)}
          />
        </FormField>
      </FormSection>
      <FormSection legend={t("placeAndOrder")}>
        <FormField label={t("venue")} required>
          <Input
            name="venue"
            value={collab.draft.venue}
            onChange={(e) => collab.edit("venue", e.currentTarget.value)}
          />
        </FormField>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
          <FormField label={t("outlineDeadlineDate")}>
            <Input
              name="deadline_date"
              type="date"
              value={collab.draft.deadline_date}
              onChange={(e) => collab.edit("deadline_date", e.currentTarget.value)}
            />
          </FormField>
          <FormField label={t("outlineDeadlineTime")}>
            <Input
              name="deadline_time"
              type="time"
              value={collab.draft.deadline_time}
              onChange={(e) => collab.edit("deadline_time", e.currentTarget.value)}
            />
          </FormField>
        </SimpleGrid>
        <Text fontSize="xs" color="fg.muted">
          {t("outlineDeadlineHelp")}
        </Text>
      </FormSection>
      <ConflictBanner {...collab.bannerProps} fieldLabels={fieldLabels} />
      <Button type="submit" alignSelf="flex-start" loading={collab.pending}>
        {t("saveDetails")}
      </Button>
      <FormResult state={collab.result} saved={t("saved")} />
    </chakra.form>
  );
}
