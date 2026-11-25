import { Input, SimpleGrid, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CheckboxChoice } from "@/components/ui/choice";
import { FormField } from "@/components/ui/form-field";

// One payment in the payment form: the received tick, the day it arrived and
// the bank's transaction number. `name` is "fee" or "outline".
export function PaymentFields(props: {
  name: "fee" | "outline";
  label: string;
  paid: boolean;
  paidOn: string;
  transaction: string;
  onPaidChange: (checked: boolean) => void;
  onPaidOnChange: (value: string) => void;
  onTransactionChange: (value: string) => void;
}) {
  const t = useTranslations("coordinator");
  return (
    <Stack gap="1">
      <CheckboxChoice
        name={`${props.name}_paid`}
        checked={props.paid}
        onCheckedChange={props.onPaidChange}
      >
        {props.label}
      </CheckboxChoice>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" ps={{ sm: "8" }}>
        <FormField label={t("dateReceived")}>
          <Input
            name={`${props.name}_paid_on`}
            type="date"
            value={props.paidOn}
            onChange={(e) => props.onPaidOnChange(e.currentTarget.value)}
          />
        </FormField>
        <FormField label={t("transaction")} optionalLabel={t("optional")}>
          <Input
            name={`${props.name}_transaction`}
            value={props.transaction}
            onChange={(e) => props.onTransactionChange(e.currentTarget.value)}
            maxLength={100}
            autoComplete="off"
          />
        </FormField>
      </SimpleGrid>
    </Stack>
  );
}
