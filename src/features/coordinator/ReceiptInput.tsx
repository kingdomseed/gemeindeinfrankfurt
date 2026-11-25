"use client";

import { chakra } from "@chakra-ui/react";
import { useRef } from "react";

import { shrinkPhoto } from "./receipt-photo";

// A file input for an invoice photo that shrinks the photo in the browser,
// so a phone picture fits through the upload.
export function ReceiptInput(props: { label: string; busy: (busy: boolean) => void }) {
  const latest = useRef(0);
  return (
    <chakra.input
      type="file"
      name="photo"
      accept="image/jpeg,image/png,image/webp"
      aria-label={props.label}
      fontSize="sm"
      onChange={(e) => {
        const input = e.currentTarget;
        const file = input.files?.[0];
        if (!file) return;
        const id = latest.current + 1;
        latest.current = id;
        props.busy(true);
        void (async () => {
          try {
            const small = await shrinkPhoto(file);
            if (latest.current !== id) return;
            const files = new DataTransfer();
            files.items.add(small);
            input.files = files.files;
          } finally {
            if (latest.current === id) props.busy(false);
          }
        })();
      }}
    />
  );
}
