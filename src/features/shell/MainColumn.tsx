import { Box, Container } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { mainContentId } from "@/components/ui/skip-link";

// The narrow <main> column of the training pages, announcements, events and
// the privacy notice. It starts at the same left edge as the church pages, so
// the text does not jump sideways when a visitor moves between them.
export function MainColumn({ children }: { children: ReactNode }) {
  return (
    <Container as="main" id={mainContentId} tabIndex={-1} maxW="6xl" px="4" pt="6" pb="16">
      <Box maxW="3xl">{children}</Box>
    </Container>
  );
}
