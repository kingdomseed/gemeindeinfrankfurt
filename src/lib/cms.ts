import "server-only";
import config from "@payload-config";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import { cache } from "react";
import { z } from "zod";

import { cmsCacheTag } from "@/cms/revalidate";
import { locales, type Locale } from "@/i18n/routing";
import { earliestOpenEndDate } from "@/lib/domain/announcements";
import { startOfBerlinToday } from "@/lib/domain/events";
import type { SitemapPage } from "@/lib/domain/sitemap";

// Public pages and site settings from Payload, read through its Local API.
// Content comes from editors, so every document is parsed before it is used.
//
// Reads are kept in Next.js's data cache, so visitors never wait on the
// database: a CMS edit refreshes them through the hooks in src/cms/revalidate.ts,
// and they also expire once a day in case the database was changed directly.
// The cache stores JSON, so documents are parsed after they come out of it.

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

export type ChurchEvent = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  location: string;
  details: string;
  link: string;
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
  | { type: "announcements"; id: string; heading: string; items: Announcement[] }
  | { type: "upcomingEvents"; id: string; heading: string; items: ChurchEvent[] };

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
  z.object({
    blockType: z.literal("upcomingEvents"),
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

const storedEvents = z.array(
  z.object({
    id: z.union([z.number(), z.string()]),
    title: z.string(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullish(),
    allDay: z.boolean().nullish(),
    location: z.string().nullish(),
    details: z.string().nullish(),
    link: z
      .url({ protocol: /^https$/ })
      .nullish()
      .catch(null),
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

const oneDay = 86_400;
// Announcements start and end at set times, without anyone editing them.
const oneHour = 3_600;

function cached<Args extends unknown[], Result>(
  key: string,
  load: (...args: Args) => Promise<Result>,
  revalidate = oneDay,
) {
  return unstable_cache(load, [key], { tags: [cmsCacheTag], revalidate });
}

const readPageIndex = cached("cms-page-index", async () => {
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
  return docs;
});

const readPage = cached("cms-page", async (id: number | string, locale: Locale) =>
  (await cms()).findByID({
    collection: "pages",
    id,
    locale,
    depth: 0,
    select: { title: true, body: true, layout: true },
  }),
);

const readAnnouncements = cached(
  "cms-announcements",
  async (locale: Locale, limit: number) => {
    const now = new Date();
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
          { publishedAt: { less_than_equal: now.toISOString() } },
          {
            or: [
              { showUntil: { exists: false } },
              { showUntil: { greater_than_equal: earliestOpenEndDate(now) } },
            ],
          },
        ],
      },
      select: { title: true, body: true, publishedAt: true },
    });
    return docs;
  },
  oneHour,
);

// Every published announcement, ended ones too, for the archive page.
const readAnnouncementArchive = cached(
  "cms-announcement-archive",
  async (locale: Locale) => {
    const { docs } = await (
      await cms()
    ).find({
      collection: "announcements",
      locale,
      depth: 0,
      limit: 500,
      sort: "-publishedAt",
      where: {
        and: [
          { _status: { equals: "published" } },
          { publishedAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
      select: { title: true, body: true, publishedAt: true },
    });
    return docs;
  },
  oneHour,
);

const readUpcomingEvents = cached(
  "cms-upcoming-events",
  async (locale: Locale, limit: number) => {
    const since = startOfBerlinToday(new Date()).toISOString();
    const { docs } = await (
      await cms()
    ).find({
      collection: "events",
      locale,
      depth: 0,
      limit,
      sort: "startsAt",
      where: {
        and: [
          { _status: { equals: "published" } },
          {
            or: [
              { endsAt: { greater_than_equal: since } },
              {
                and: [{ endsAt: { exists: false } }, { startsAt: { greater_than_equal: since } }],
              },
            ],
          },
        ],
      },
      select: {
        title: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
        location: true,
        details: true,
        link: true,
      },
    });
    return docs;
  },
  oneHour,
);

const readSiteSettings = cached("cms-site-settings", async (locale: Locale) =>
  (await cms()).findGlobal({ slug: "site-settings", locale, depth: 0 }),
);

// The default language fills in for a page that has no text in this one,
// as Payload's own fallback does for single-locale reads.
function inLocale(value: z.infer<typeof inEveryLocale>, locale: Locale): string {
  return value[locale] ?? value.de ?? "";
}

// Every page with its title and slug in every language, in menu order.
const loadPages = cache(async () => pageIndex.parse(await readPageIndex()));

// False when the database can't be reached, for example during a build
// without one. Pages are then built on their first visit instead.
export async function canReachCms(): Promise<boolean> {
  try {
    await loadPages();
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`CMS not reachable, church pages will be built on first visit: ${reason}`);
    return false;
  }
}

export async function getNavigation(locale: Locale): Promise<NavPage[]> {
  return (await loadPages()).map((page) => ({
    title: inLocale(page.title, locale),
    slug: inLocale(page.slug, locale),
    isHome: page.isHome === true,
  }));
}

// Every page's slug in each language, for sitemap.xml.
export async function getPageSlugs(): Promise<SitemapPage[]> {
  return (await loadPages()).map((page) => ({ isHome: page.isHome === true, slugs: page.slug }));
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
  const page = pageContent.parse(await readPage(id, locale));
  const blocks = await Promise.all(
    (page.layout ?? []).map((block, index) => toPageBlock(block, `block-${index}`, locale)),
  );
  return {
    title: page.title,
    body: page.body ?? null,
    blocks,
    pageHrefs: await getPageHrefs(locale),
  };
}

// Maps each page id to its address in this language, for links inside rich text.
export async function getPageHrefs(locale: Locale): Promise<Record<string, string>> {
  return Object.fromEntries(
    (await loadPages()).map((p) => [
      String(p.id),
      p.isHome === true ? `/${locale}` : `/${locale}/${inLocale(p.slug, locale)}`,
    ]),
  );
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
  if (block.blockType === "upcomingEvents") {
    return {
      type: "upcomingEvents",
      id,
      heading: block.heading ?? "",
      items: await getUpcomingEvents(locale, block.limit ?? 4),
    };
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
  return storedAnnouncements.parse(await readAnnouncements(locale, limit)).map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    body: doc.body ?? null,
    publishedAt: doc.publishedAt,
  }));
}

// Every published announcement that has started, newest first.
export async function getAnnouncementArchive(locale: Locale): Promise<Announcement[]> {
  return storedAnnouncements.parse(await readAnnouncementArchive(locale)).map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    body: doc.body ?? null,
    publishedAt: doc.publishedAt,
  }));
}

// Published events that have not yet ended, soonest first.
export async function getUpcomingEvents(locale: Locale, limit: number): Promise<ChurchEvent[]> {
  return storedEvents.parse(await readUpcomingEvents(locale, limit)).map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt ?? null,
    allDay: doc.allDay === true,
    location: doc.location ?? "",
    details: doc.details ?? "",
    link: doc.link ?? "",
  }));
}

// The Zoom link for the meetings. Only the announcements page, which search
// engines don't index, reads it.
export const getMeetingLink = cache(async (locale: Locale): Promise<string | null> => {
  const { meetingLink } = z
    .object({ meetingLink: z.union([z.url(), z.literal("")]).nullish() })
    .parse(await readSiteSettings(locale));
  return meetingLink || null;
});

export const getSiteSettings = cache(async (locale: Locale): Promise<SiteSettings> => {
  const settings = siteSettings.parse(await readSiteSettings(locale));
  return {
    siteName: settings.siteName ?? "",
    tagline: settings.tagline ?? "",
    contactHeading: settings.contactHeading ?? "",
    contactIntro: settings.contactIntro ?? "",
    meetingAddress: settings.meetingAddress ?? "",
    contactEmail: settings.contactEmail || null,
  };
});
