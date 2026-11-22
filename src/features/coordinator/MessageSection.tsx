import { Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A titled part of a message: its hymns or its verses.
export function MessageSection(props: { title: string; help?: string; children: ReactNode }) {
  return (
    <Stack as="section" gap="3">
      <Heading as="h3" size="md">
        {props.title}
      </Heading>
      {props.help && (
        <Text fontSize="sm" color="fg.muted">
          {props.help}
        </Text>
      )}
      {props.children}
    </Stack>
  );
}
