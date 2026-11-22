import { Box, Grid } from "@chakra-ui/react";
import type { ReactNode } from "react";

// One label and value of the webcast login, inside its <dl>.
export function LoginRow(props: { label: string; last?: boolean; children: ReactNode }) {
  return (
    <Grid
      templateColumns="minmax(6rem, max-content) minmax(0, 1fr)"
      columnGap="6"
      rowGap="1"
      alignItems="center"
      py="2"
      borderBottomWidth={props.last ? "0" : "1px"}
    >
      <Box as="dt" color="fg.muted">
        {props.label}
      </Box>
      <Box as="dd" minW="0">
        {props.children}
      </Box>
    </Grid>
  );
}
