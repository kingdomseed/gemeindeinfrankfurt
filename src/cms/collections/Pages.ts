import type { CollectionConfig } from "payload";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Fixed routes under /[locale] that would hide a CMS page with the same slug.
const reservedSlugs = new Set(["training", "privacy"]);

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
          "Part of the address, e.g. fur-besucher. Lowercase letters, digits and hyphens; not training or privacy.",
      },
      validate: (value: string | null | undefined) => {
        if (value == null || !slugPattern.test(value)) {
          return "Use lowercase letters, digits and hyphens only.";
        }
        return reservedSlugs.has(value) ? `"${value}" is already used by the site.` : true;
      },
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
