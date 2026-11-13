import type { CollectionConfig } from "payload";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The church's public pages. Each language has its own title, URL slug and
// text; the page marked as home is shown at /[locale].
export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "navOrder", "isHome"],
  },
  defaultSort: "navOrder",
  fields: [
    { name: "title", type: "text", localized: true, required: true },
    {
      name: "slug",
      type: "text",
      localized: true,
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
        description:
          "Part of the address, e.g. fur-besucher. Lowercase letters, digits and hyphens.",
      },
      validate: (value: string | null | undefined) =>
        value != null && slugPattern.test(value)
          ? true
          : "Use lowercase letters, digits and hyphens only.",
    },
    { name: "body", type: "richText", localized: true },
    {
      name: "navOrder",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: { position: "sidebar", description: "Position in the main menu, lowest first." },
    },
    {
      name: "isHome",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Show this page at the start address (/de, /en, /ru).",
      },
    },
  ],
};
