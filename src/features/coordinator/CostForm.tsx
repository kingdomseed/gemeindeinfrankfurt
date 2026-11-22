"use client";

import { Button, chakra, Grid, Input } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { FormField } from "@/components/ui/form-field";

import { FormResult } from "./FormResult";
import { ReceiptInput } from "./ReceiptInput";
import type { FormState } from "./types";

const empty = { description: "", amount: "", paidBy: "", paidOn: "" };

// Adds a cost to reimburse, with a photo of its invoice. The boxes keep
// what was typed when something is wrong, and empty once the cost is added.
export function CostForm(props: { add: (prev: FormState, form: FormData) => Promise<FormState> }) {
  const t = useTranslations("coordinator.report");
  const [fields, setFields] = useState(empty);
  const [shrinking, setShrinking] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prev, form) => {
      const result = await props.add(prev, form);
      if (result.status === "saved") setFields(empty);
      return result;
    },
    { status: "idle" },
  );
  const field = (name: keyof typeof empty) => ({
    value: fields[name],
    onChange: (e: { currentTarget: { value: string } }) => {
      const value = e.currentTarget.value;
      setFields((f) => ({ ...f, [name]: value }));
    },
  });
  return (
    <chakra.form
      action={formAction}
      display="flex"
      flexDirection="column"
      gap="4"
      borderWidth="1px"
      rounded="lg"
      p="4"
    >
      <Grid templateColumns={{ base: "1fr", sm: "minmax(0, 2fr) minmax(0, 1fr)" }} gap="4">
        <FormField label={t("costDescription")} required>
          <Input name="description" required maxLength={200} {...field("description")} />
        </FormField>
        <FormField label={t("costAmount")} required>
          <Input
            name="amount"
            required
            inputMode="decimal"
            placeholder="0,00"
            {...field("amount")}
          />
        </FormField>
        <FormField label={t("costPaidBy")}>
          <Input name="paid_by" maxLength={200} {...field("paidBy")} />
        </FormField>
        <FormField label={t("costPaidOn")}>
          <Input name="paid_on" type="date" {...field("paidOn")} />
        </FormField>
      </Grid>
      <FormField label={t("costPhoto")} help={t("costPhotoHelp")}>
        <ReceiptInput label={t("costPhoto")} busy={setShrinking} />
      </FormField>
      <Button
        type="submit"
        variant="outline"
        color="fg"
        alignSelf="flex-start"
        loading={pending}
        disabled={shrinking}
      >
        {t("addCost")}
      </Button>
      <FormResult state={state} saved={t("costAdded")} />
    </chakra.form>
  );
}
