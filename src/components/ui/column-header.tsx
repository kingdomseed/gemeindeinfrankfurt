import { Table } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A quiet table column header, as used in the coordinator tables.
export function ColumnHeader(props: { children: ReactNode; align?: "start" | "end" }) {
  return (
    <Table.ColumnHeader color="fg.muted" fontWeight="normal" textAlign={props.align}>
      {props.children}
    </Table.ColumnHeader>
  );
}
