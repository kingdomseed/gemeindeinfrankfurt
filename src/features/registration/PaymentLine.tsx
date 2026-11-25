import { Box, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";

// One label and amount in the payment summary.
export function PaymentLine(props: { label: ReactNode; children: ReactNode }) {
  return (
    <Flex
      as="div"
      justify="space-between"
      align="baseline"
      gap="6"
      fontVariantNumeric="tabular-nums"
    >
      <dt>{props.label}</dt>
      <Box as="dd" textAlign="right" fontWeight="medium">
        {props.children}
      </Box>
    </Flex>
  );
}
