"use client";

import { Checkbox, Text } from "@chakra-ui/react";
import { useOptimistic, useState, useTransition } from "react";

import type { PaymentField, SetPaymentFlag } from "./types";

// Marks one payment as received. The tick shows at once and falls back to the
// saved value if the server refuses.
export function PaymentToggle(props: {
  id: string;
  field: PaymentField;
  value: boolean;
  setPaymentFlag: SetPaymentFlag;
  label: string; // accessible name, including whose payment this is
  visibleLabel?: string | undefined;
  failedLabel: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(props.value);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <Checkbox.Root
      checked={optimistic}
      disabled={pending}
      minH="11"
      minW="11"
      gap="2"
      cursor="pointer"
      onCheckedChange={(e) => {
        const value = e.checked === true;
        setFailed(false);
        start(async () => {
          setOptimistic(value);
          try {
            await props.setPaymentFlag({ id: props.id, field: props.field, value });
          } catch {
            setFailed(true); // the optimistic value falls back to the server's
          }
        });
      }}
    >
      <Checkbox.HiddenInput aria-label={props.label} />
      <Checkbox.Control />
      {props.visibleLabel && (
        <Checkbox.Label aria-hidden fontWeight="normal">
          {props.visibleLabel}
        </Checkbox.Label>
      )}
      {failed && (
        <Text as="span" role="alert" fontSize="sm" fontWeight="semibold" color="fg.error">
          {props.failedLabel}
        </Text>
      )}
    </Checkbox.Root>
  );
}
