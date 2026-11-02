"use client";

import type { ChangeEvent, ReactNode } from "react";

import { fieldClass } from "@/components/styles";

export function Section(props: {
  legend: string;
  disabled?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <fieldset disabled={props.disabled} className="min-w-0 disabled:opacity-70">
      <legend className="mb-3 text-lg font-semibold">{props.legend}</legend>
      {props.children}
    </fieldset>
  );
}

export function Text(props: {
  name: string;
  label: string;
  value?: string | undefined;
  type?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean | undefined;
}) {
  return (
    <label className="block">
      {props.label}
      {props.hint && <span className="text-sm text-muted"> ({props.hint})</span>}
      <input
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.value}
        required={props.required}
        disabled={props.disabled}
        autoComplete={props.autoComplete}
        className={fieldClass}
      />
    </label>
  );
}

export function Choice(props: {
  type: "radio" | "checkbox";
  name: string;
  value?: string;
  required?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  describedBy?: string | undefined;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
      <input
        type={props.type}
        name={props.name}
        value={props.value}
        required={props.required}
        checked={props.checked}
        defaultChecked={props.defaultChecked}
        aria-describedby={props.describedBy}
        onChange={props.onChange}
        className="mt-0.5 size-5 shrink-0"
      />
      <span>{props.children}</span>
    </label>
  );
}
