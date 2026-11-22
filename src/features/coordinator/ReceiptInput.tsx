"use client";

import { chakra } from "@chakra-ui/react";

import { shrinkPhoto } from "./receipt-photo";

// A file input for an invoice photo that shrinks the photo in the browser,
// so a phone picture fits through the upload.
export function ReceiptInput(props: { label: string; busy: (busy: boolean) => void }) {
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
        props.busy(true);
        void (async () => {
          const small = await shrinkPhoto(file);
          const files = new DataTransfer();
          files.items.add(small);
          input.files = files.files;
          props.busy(false);
        })();
      }}
    />
  );
}
