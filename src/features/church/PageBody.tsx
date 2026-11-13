import {
  LinkJSXConverter,
  RichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";

import { Prose } from "@/components/ui/prose";
import type { RichTextContent } from "@/lib/cms";

export function PageBody({
  content,
  pageHrefs,
}: {
  content: RichTextContent;
  pageHrefs: Record<string, string>;
}) {
  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({
      internalDocToHref: ({ linkNode }) => {
        const target = linkNode.fields.doc?.value;
        const id = typeof target === "object" ? target.id : target;
        return id === undefined ? "#" : (pageHrefs[String(id)] ?? "#");
      },
    }),
  });
  return (
    <Prose>
      <RichText data={content} converters={converters} disableContainer />
    </Prose>
  );
}
