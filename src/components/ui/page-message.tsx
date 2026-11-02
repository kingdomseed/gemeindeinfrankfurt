import { Text } from "@chakra-ui/react";

// The whole body of a page that has nothing else to show, such as "not open
// yet", "closed" or "link not valid".
export function PageMessage({ children }: { children: string }) {
  return <Text mt="10">{children}</Text>;
}
