import "server-only";
import config from "@payload-config";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { getPayload } from "payload";
import { cache } from "react";
import { z } from "zod";

import { locales, type Locale } from "@/i18n/routing";
import { earliestOpenEndDate } from "@/lib/domain/announcements";

// Public pages and site settings from Payload, read through its Local API.
// Content comes from editors, so every document is parsed before it is used.

export type RichTextContent = SerializedEditorState;

export type NavPage = { title: string; slug: string; isHome: boolean };

// pageHrefs maps a page id to its address in this language, for links
// editors make to other pages.
export type PageContent = {
  title: string;
  body: RichTextContent | null;
  blocks: PageBlock[];
  pageHrefs: Record<string, string>;
};

export type Announcement = {
  id: string;
  title: string;
  body: RichTextContent | null;
  publishedAt: Date;
};

// A section of a page, as an editor stacked it in the CMS.
export type PageBlock =
  | { type: "text"; id: string; content: RichTextContent }
  | {
      type: "faq";
      id: string;
      items: { id: string; question: string; answer: RichTextContent }[];
    }
  | {
      type: "statements";
      id: string;
      items: { id: string; heading: string; text: string; references: string }[];
    }
  | { type: "meetingPlace"; id: string; heading: string }
  | { type: "announcements"; id: string; heading: string; items: Announcement[] };

export type SiteSettings = {
  siteName: string;
  tagline: string;
  contactHeading: string;
  contactIntro: string;
  meetingAddress: string;
  contactEmail: string | null;
};

function isEditorState(value: unknown): value is SerializedEditorState {
  return (
    typeof value === "object" &&
    value !== null &&
    "root" in value &&
    typeof value.root === "object" &&
    value.root !== null &&
    "children" in value.root &&
    Array.isArray(value.root.children)
  );
}

const editorState = z.custom<SerializedEditorState>(isEditorState);

// With locale "all", Payload returns a localized field as { de, en, ru },
// leaving out languages nobody has filled in.
const inEveryLocale = z.object({
  de: z.string().optional(),
  en: z.string().optional(),
  ru: z.string().optional(),
});

const pageIndex = z.array(
  z.object({
    id: z.union([z.number(), z.string()]),
    title: inEveryLocale,
    slug: inEveryLocale,
    isHome: z.boolean().nullish(),
  }),
);

const rowId = z.string().nullish();

const storedBlock = z.discriminatedUnion("blockType", [
  z.object({ blockType: z.literal("text"), id: rowId, content: editorState }),
  z.object({
    blockType: z.literal("faq"),
    id: rowId,
    items: z.array(z.object({ id: rowId, question: z.string(), answer: editorState })),
  }),
  z.object({
    blockType: z.literal("statements"),
    id: rowId,
    items: z.array(
      z.object({
        id: rowId,
        heading: z.string(),
        text: z.string(),
        references: z.string().nullish(),
      }),
    ),
  }),
  z.object({ blockType: z.literal("meetingPlace"), id: rowId, heading: z.string().nullish() }),
  z.object({
    blockType: z.literal("announcements"),
    id: rowId,
    heading: z.string().nullish(),
    limit: z.number().nullish(),
  }),
]);

const pageContent = z.object({
  title: z.string(),
  body: editorState.nullish(),
  layout: z.array(storedBlock).nullish(),
});

const storedAnnouncements = z.array(
  z.object({
    id: z.union([z.number(), z.string()]),
    title: z.string(),
    body: editorState.nullish(),
    publishedAt: z.coerce.date(),
  }),
);

// Every field may be empty on a new database before the seed has run; the
// training pages share this layout and must still load.
const siteSettings = z.object({
  siteName: z.string().nullish(),
  tagline: z.string().nullish(),
  contactHeading: z.string().nullish(),
  contactIntro: z.string().nullish(),
  meetingAddress: z.string().nullish(),
  contactEmail: z.string().nullish(),
});

const cms = () => getPayload({ config });

// The default language fills in for a page that has no text in this one,
// as Payload's own fallback does for single-locale reads.
function inLocale(value: z.infer<typeof inEveryLocale>, locale: Locale): string {
  return value[locale] ?? value.de ?? "";
}

// Every page with its title and slug in every language, in menu order.
const loadPages = cache(async () => {
  const { docs } = await (
    await cms()
  ).find({
    collection: "pages",
    locale: "all",
    depth: 0,
    pagination: false,
    sort: "navOrder",
    select: { title: true, slug: true, isHome: true },
  });
  return pageIndex.parse(docs);
});

export async function getNavigation(locale: Locale): Promise<NavPage[]> {
  return (await loadPages()).map((page) => ({
    title: inLocale(page.title, locale),
    slug: inLocale(page.slug, locale),
    isHome: page.isHome === true,
  }));
}

type PageMatch = { id: number | string; title: string; slug: string; isHome: boolean };

// Finds the page for /[locale]/[slug]. A slug from another language (for
// example /en/fur-besucher after switching language) still finds its page;
// the returned slug is the one to use in this language.
export async function findPage(locale: Locale, slug: string): Promise<PageMatch | null> {
  const pages = await loadPages();
  const page =
    pages.find((p) => inLocale(p.slug, locale) === slug) ??
    pages.find((p) => locales.some((other) => p.slug[other] === slug));
  if (!page) return null;
  return {
    id: page.id,
    title: inLocale(page.title, locale),
    slug: inLocale(page.slug, locale),
    isHome: page.isHome === true,
  };
}

export async function getHomePageId(): Promise<number | string | null> {
  return (await loadPages()).find((page) => page.isHome === true)?.id ?? null;
}

export async function getPageContent(id: number | string, locale: Locale): Promise<PageContent> {
  const doc = await (
    await cms()
  ).findByID({
    collection: "pages",
    id,
    locale,
    depth: 0,
    select: { title: true, body: true, layout: true },
  });
  const page = pageContent.parse(doc);
  const blocks = await Promise.all(
    (page.layout ?? []).map((block, index) => toPageBlock(block, `block-${index}`, locale)),
  );
  const pageHrefs = Object.fromEntries(
    (await loadPages()).map((p) => [
      String(p.id),
      p.isHome === true ? `/${locale}` : `/${locale}/${inLocale(p.slug, locale)}`,
    ]),
  );
  return { title: page.title, body: page.body ?? null, blocks, pageHrefs };
}

async function toPageBlock(
  block: z.infer<typeof storedBlock>,
  fallbackId: string,
  locale: Locale,
): Promise<PageBlock> {
  const id = block.id ?? fallbackId;
  if (block.blockType === "text") return { type: "text", id, content: block.content };
  if (block.blockType === "faq") {
    return {
      type: "faq",
      id,
      items: block.items.map((item, index) => ({
        id: item.id ?? `${id}-${index}`,
        question: item.question,
        answer: item.answer,
      })),
    };
  }
  if (block.blockType === "statements") {
    return {
      type: "statements",
      id,
      items: block.items.map((item, index) => ({
        id: item.id ?? `${id}-${index}`,
        heading: item.heading,
        text: item.text,
        references: item.references ?? "",
      })),
    };
  }
  if (block.blockType === "meetingPlace") {
    return { type: "meetingPlace", id, heading: block.heading ?? "" };
  }
  return {
    type: "announcements",
    id,
    heading: block.heading ?? "",
    items: await getAnnouncements(locale, block.limit ?? 3),
  };
}

// Published announcements that have started and not yet ended, newest first.
export async function getAnnouncements(locale: Locale, limit: number): Promise<Announcement[]> {
  const now = new Date().toISOString();
  const { docs } = await (
    await cms()
  ).find({
    collection: "announcements",
    locale,
    depth: 0,
    limit,
    sort: "-publishedAt",
    where: {
      and: [
        { _status: { equals: "published" } },
        { publishedAt: { less_than_equal: now } },
        {
          or: [
            { showUntil: { exists: false } },
            { showUntil: { greater_than_equal: earliestOpenEndDate(new Date()) } },
          ],
        },
      ],
    },
    select: { title: true, body: true, publishedAt: true },
  });
  return storedAnnouncements.parse(docs).map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    body: doc.body ?? null,
    publishedAt: doc.publishedAt,
  }));
}

export const getSiteSettings = cache(async (locale: Locale): Promise<SiteSettings> => {
  const doc = await (await cms()).findGlobal({ slug: "site-settings", locale, depth: 0 });
  const settings = siteSettings.parse(doc);
  return {
    siteName: settings.siteName ?? "",
    tagline: settings.tagline ?? "",
    contactHeading: settings.contactHeading ?? "",
    contactIntro: settings.contactIntro ?? "",
    meetingAddress: settings.meetingAddress ?? "",
    contactEmail: settings.contactEmail || null,
  };
});
