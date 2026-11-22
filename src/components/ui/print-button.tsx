"use client";

import { Button } from "@chakra-ui/react";

// Opens the browser's print dialog for the page.
export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="outline" color="fg" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
