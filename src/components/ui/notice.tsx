import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { focusOnMount } from "./focus";

const tones = {
  success: { bg: "bg.success", color: "fg.success" },
  warning: { bg: "bg.warning", color: "fg.warning" },
  neutral: { bg: "bg.subtle", color: "fg" },
} as const;

// A tinted message block. `announce="alert"` reads an error out, `announce="status"`
// renders an <output> for the result of an action, and no role is a plain note.
export function Notice(props: {
  tone: keyof typeof tones;
  announce?: "alert" | "status";
  focus?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      as={props.announce === "status" ? "output" : "p"}
      role={props.announce === "alert" ? "alert" : undefined}
      display="block"
      rounded="lg"
      p="4"
      outline="none"
      {...tones[props.tone]}
      {...(props.focus && { ref: focusOnMount, tabIndex: -1 })}
    >
      {props.children}
    </Box>
  );
}
