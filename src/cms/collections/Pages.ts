import type { CollectionConfig, PayloadRequest, TextFieldSingleValidation } from "payload";

import { pageBlocks } from "@/cms/blocks";
import { revalidateAfterChange, revalidateAfterDelete } from "@/cms/revalidate";
import { locales } from "@/i18n/routing";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Fixed routes under /[locale] that would hide a CMS page with the same slug.
const reservedSlugs = new Set(["training", "privacy", "impressum", "events"]);

// True when another page already has this slug in any language. A visitor who
// switches language keeps the slug in the address, so one slug must always
// lead to the same page. The lookups run outside the request, because passing
// it on would switch the request to each looked-up language in turn.
async function usedByAnotherPage(req: PayloadRequest, slug: string, ownId: unknown) {
  const found = await Promise.all(
    locales.map((locale) =>
      req.payload.find({
        collection: "pages",
        locale,
        fallbackLocale: false,
        where: { slug: { equals: slug } },
        depth: 0,
        limit: 2,
        select: {},
      }),
    ),
  );
  return found.some(({ docs }) => docs.some((doc) => String(doc.id) !== String(ownId)));
}

const validateSlug: TextFieldSingleValidation = async (value, { req, id }) => {
  if (value == null || !slugPattern.test(value)) {
    return "Use lowercase letters, digits and hyphens only.";
  }
  if (reservedSlugs.has(value)) return `"${value}" is already used by the site.`;
  return (await usedByAnotherPage(req, value, id))
    ? `"${value}" is already the address of another page, in this or another language.`
    : true;
};

// The church's public pages. Each language has its own title, URL slug and
// text; the page marked as home is shown at /[locale].
export const Pages: CollectionConfig = {
  slug: "pages",
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
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
          "Part of the address, e.g. fur-besucher. Lowercase letters, digits and hyphens; not training, privacy, impressum or events, and not the address of another page in any language.",
      },
      validate: validateSlug,
    },
    {
      name: "layout",
      type: "blocks",
      localized: true,
      blocks: pageBlocks,
      admin: { initCollapsed: true, description: "The sections of the page, top to bottom." },
    },
    {
      name: "body",
      type: "richText",
      localized: true,
      admin: { description: "Shown only while the page has no sections above." },
    },
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
