import { Checkbox, RadioGroup } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A checkbox with its label, sized as a 44px touch target. Works both
// uncontrolled (defaultChecked) and controlled (checked + onCheckedChange).
export function CheckboxChoice(props: {
  name: string;
  value?: string;
  required?: boolean;
  disabled?: boolean | undefined;
  checked?: boolean;
  defaultChecked?: boolean;
  invalid?: boolean;
  describedBy?: string | undefined;
  onCheckedChange?: (checked: boolean) => void;
  children: ReactNode;
}) {
  const { onCheckedChange } = props;
  return (
    <Checkbox.Root
      name={props.name}
      value={props.value ?? "on"}
      required={props.required}
      disabled={props.disabled}
      invalid={props.invalid}
      alignItems="flex-start"
      minH="11"
      py="2"
      gap="3"
      cursor="pointer"
      {...(props.checked === undefined ? {} : { checked: props.checked })}
      {...(props.defaultChecked === undefined ? {} : { defaultChecked: props.defaultChecked })}
      {...(onCheckedChange && {
        onCheckedChange: (e: { checked: boolean | "indeterminate" }) =>
          onCheckedChange(e.checked === true),
      })}
    >
      <Checkbox.HiddenInput aria-describedby={props.describedBy} />
      <Checkbox.Control mt="0.5" />
      <Checkbox.Label fontWeight="normal">{props.children}</Checkbox.Label>
    </Checkbox.Root>
  );
}

// One-of-many choice shown as a vertical list of radios.
export function RadioChoices<T extends string>(props: {
  name: string;
  value: T;
  options: readonly { value: T; label: string }[];
  disabled?: boolean | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <RadioGroup.Root
      name={props.name}
      value={props.value}
      disabled={props.disabled}
      onValueChange={(e) => {
        const picked = props.options.find((o) => o.value === e.value);
        if (picked) props.onChange(picked.value);
      }}
    >
      {props.options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          display="flex"
          alignItems="flex-start"
          minH="11"
          py="2"
          gap="3"
          cursor="pointer"
        >
          <RadioGroup.ItemHiddenInput />
          <RadioGroup.ItemIndicator mt="0.5" />
          <RadioGroup.ItemText fontWeight="normal">{o.label}</RadioGroup.ItemText>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
