import { Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

// The small capitals line over a section heading that names the section.
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="bold"
      letterSpacing="0.12em"
      textTransform="uppercase"
      color="brand.fg"
    >
      {children}
    </Text>
  );
}
