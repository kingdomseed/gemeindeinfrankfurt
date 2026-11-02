"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setPaymentFlag } from "./actions";

export function PaymentToggle(props: {
  id: string;
  field: "fee_paid" | "outline_paid";
  value: boolean;
  label: string; // accessible name, including whose payment this is
  visibleLabel?: string;
  failedLabel: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(props.value);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        aria-label={props.label}
        checked={optimistic}
        disabled={pending}
        className="size-5 shrink-0"
        onChange={(e) => {
          const value = e.target.checked;
          setFailed(false);
          start(async () => {
            setOptimistic(value);
            try {
              await setPaymentFlag({ id: props.id, field: props.field, value });
            } catch {
              setFailed(true); // the optimistic value falls back to the server's
            }
          });
        }}
      />
      {props.visibleLabel && <span aria-hidden>{props.visibleLabel}</span>}
      {failed && (
        <span role="alert" className="text-sm font-semibold text-danger">
          {props.failedLabel}
        </span>
      )}
    </label>
  );
}
