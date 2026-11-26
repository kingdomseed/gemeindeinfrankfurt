"use client";

import { chakra } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { noticeRecipe } from "@/theme/box-recipes";

import { focusOnMount } from "./focus";

const NoticeBox = chakra("p", noticeRecipe);

// A tinted message block. `announce="alert"` reads an error out, `announce="status"`
// renders an <output> for the result of an action, and no role is a plain note.
export function Notice(props: {
  tone: "neutral" | "success" | "warning" | "error";
  announce?: "alert" | "status";
  focus?: boolean;
  children: ReactNode;
}) {
  return (
    <NoticeBox
      as={props.announce === "status" ? "output" : "p"}
      role={props.announce === "alert" ? "alert" : undefined}
      tone={props.tone}
      animated={Boolean(props.announce)}
      {...(props.focus && { ref: focusOnMount, tabIndex: -1 })}
    >
      {props.children}
    </NoticeBox>
  );
}
