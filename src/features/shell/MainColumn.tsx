import { Container } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { mainContentId } from "@/components/ui/skip-link";

// The centred <main> column shared by single-column pages: training,
// announcements, events, privacy, imprint and coordinator sign-in.
export function MainColumn({ children }: { children: ReactNode }) {
  return (
    <Container
      as="main"
      id={mainContentId}
      tabIndex={-1}
      maxW="3xl"
      px="4"
      pt={{ base: "8", md: "10" }}
      pb="16"
    >
      {children}
    </Container>
  );
}
