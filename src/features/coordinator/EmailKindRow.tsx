import { List, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

// One kind of email with what it holds, and its state or send button.
export function EmailKindRow(props: { name: string; what: string; children: ReactNode }) {
  return (
    <List.Item
      display="grid"
      gridTemplateColumns="minmax(0, 1fr) auto"
      columnGap="4"
      rowGap="1"
      alignItems="center"
      py="2"
      borderBottomWidth="1px"
    >
      <Stack gap="0">
        <Text>{props.name}</Text>
        <Text fontSize="xs" color="fg.muted">
          {props.what}
        </Text>
      </Stack>
      {props.children}
    </List.Item>
  );
}
