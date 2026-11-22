import { Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A titled part of a coordinator page, with an optional muted line under the title.
export function WorkspaceSection(props: { title: string; help?: string; children: ReactNode }) {
  return (
    <Stack as="section" gap="4">
      <Stack gap="1">
        <Heading as="h2" size="xl">
          {props.title}
        </Heading>
        {props.help && (
          <Text fontSize="sm" color="fg.muted">
            {props.help}
          </Text>
        )}
      </Stack>
      {props.children}
    </Stack>
  );
}
