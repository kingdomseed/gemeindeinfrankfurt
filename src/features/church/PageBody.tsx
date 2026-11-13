import { RichText } from "@payloadcms/richtext-lexical/react";

import { Prose } from "@/components/ui/prose";
import type { RichTextContent } from "@/lib/cms";

export function PageBody({ content }: { content: RichTextContent }) {
  return (
    <Prose>
      <RichText data={content} disableContainer />
    </Prose>
  );
}
