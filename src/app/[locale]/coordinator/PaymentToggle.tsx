"use client";

import { useOptimistic, useTransition } from "react";
import { setPaymentFlag } from "./actions";

export function PaymentToggle(props: {
  id: string;
  field: "fee_paid" | "outline_paid";
  value: boolean;
  label: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(props.value);
  const [pending, start] = useTransition();
  return (
    <input
      type="checkbox"
      aria-label={props.label}
      checked={optimistic}
      disabled={pending}
      className="h-5 w-5"
      onChange={(e) => {
        const value = e.target.checked;
        start(async () => {
          setOptimistic(value);
          await setPaymentFlag({ id: props.id, field: props.field, value });
        });
      }}
    />
  );
}
