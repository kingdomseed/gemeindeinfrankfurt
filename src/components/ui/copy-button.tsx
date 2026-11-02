"use client";

import { Button, Clipboard } from "@chakra-ui/react";

// Copies a value to the clipboard and says so for a moment. If the clipboard
// is blocked, the value next to it stays selectable by hand.
export function CopyButton(props: { value: string; label: string; copiedLabel: string }) {
  return (
    <Clipboard.Root value={props.value} timeout={2000}>
      <Clipboard.Trigger asChild>
        <Button variant="outline" size="xs" minH="8" borderColor="border.emphasized">
          <span aria-live="polite">
            <Clipboard.Indicator copied={props.copiedLabel}>{props.label}</Clipboard.Indicator>
          </span>
        </Button>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
}
