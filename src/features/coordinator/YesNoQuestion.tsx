"use client";

import { Button, ButtonGroup, Flex, Text } from "@chakra-ui/react";
import { useId, useOptimistic, useTransition } from "react";

// One yes/no question of the questionnaire, saved as soon as it is pressed.
// `suggested` means nobody has answered yet and the value comes from the data.
export function YesNoQuestion(props: {
  label: string;
  value: boolean;
  suggested: boolean;
  suggestedLabel: string;
  labels: { yes: string; no: string };
  answer: (value: boolean) => Promise<void>;
}) {
  const id = useId();
  const [value, setValue] = useOptimistic(props.value);
  const [, startTransition] = useTransition();
  const choose = (next: boolean) =>
    startTransition(async () => {
      setValue(next);
      await props.answer(next);
    });
  return (
    <Flex
      justify="space-between"
      align="center"
      gap="2"
      wrap="wrap"
      py="1.5"
      borderBottomWidth="1px"
    >
      <Text id={id}>
        {props.label}
        {props.suggested && (
          <Text as="span" fontSize="xs" color="fg.muted" ms="2">
            {props.suggestedLabel}
          </Text>
        )}
      </Text>
      <ButtonGroup
        as="fieldset"
        attached
        size="sm"
        aria-labelledby={id}
        borderWidth="0"
        p="0"
        m="0"
      >
        {([true, false] as const).map((option) => (
          <Button
            key={String(option)}
            type="button"
            variant={value === option ? "solid" : "outline"}
            color={value === option ? undefined : "fg"}
            aria-pressed={value === option}
            minW="20"
            onClick={() => choose(option)}
          >
            {option ? props.labels.yes : props.labels.no}
          </Button>
        ))}
      </ButtonGroup>
    </Flex>
  );
}
