import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A <dt>/<dd> pair for use inside a <dl> grid.
export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <Box as="dt" fontSize="sm" color="fg.muted">
        {label}
      </Box>
      <Box as="dd">{children}</Box>
    </>
  );
}
