import { Heading, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A <section> with an h2, for long text pages.
export function TitledSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack as="section" gap="1">
      <Heading as="h2" size="xl" fontWeight="semibold">
        {title}
      </Heading>
      {children}
    </Stack>
  );
}
