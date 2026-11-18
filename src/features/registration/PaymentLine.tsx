import { Box, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";

// One label and amount in the payment summary; `total` draws the sum line.
export function PaymentLine(props: { label: ReactNode; children: ReactNode; total?: boolean }) {
  return (
    <Flex
      as="div"
      justify="space-between"
      align="baseline"
      gap="6"
      fontVariantNumeric="tabular-nums"
      {...(props.total && {
        mt: "2",
        pt: "2",
        borderTopWidth: "1px",
        borderColor: "border.emphasized",
        fontWeight: "semibold",
      })}
    >
      <dt>{props.label}</dt>
      <Box as="dd" textAlign="right" fontSize={props.total ? "lg" : undefined}>
        {props.children}
      </Box>
    </Flex>
  );
}
