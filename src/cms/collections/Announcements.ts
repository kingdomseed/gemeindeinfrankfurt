import type { CollectionConfig } from "payload";

import { revalidateAfterChange, revalidateAfterDelete } from "@/cms/revalidate";

// Short notices an editor can post at any time. One shows on the site from
// its publish date until its optional end date, once it is published.
export const Announcements: CollectionConfig = {
  slug: "announcements",
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedAt", "showUntil", "_status"],
  },
  defaultSort: "-publishedAt",
  versions: { drafts: true },
  fields: [
    { name: "title", type: "text", localized: true, required: true },
    { name: "body", type: "richText", localized: true },
    {
      name: "publishedAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime" },
        description: "Shown on the site from this time.",
      },
    },
    {
      name: "showUntil",
      type: "date",
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayOnly" },
        description: "Optional. The announcement disappears after this day.",
      },
    },
    {
      name: "importKey",
      type: "text",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Set by the import of the weekly announcement email, so a week is not added twice.",
      },
    },
  ],
};
