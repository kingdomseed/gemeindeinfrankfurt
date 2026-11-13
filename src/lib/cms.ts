import "server-only";
import config from "@payload-config";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { getPayload } from "payload";
import { cache } from "react";
import { z } from "zod";

import { locales, type Locale } from "@/i18n/routing";

// Public pages and site settings from Payload, read through its Local API.
// Content comes from editors, so every document is parsed before it is used.

export type RichTextContent = SerializedEditorState;

export type NavPage = { title: string; slug: string; isHome: boolean };

export type PageContent = { title: string; body: RichTextContent | null };

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

const pageContent = z.object({
  title: z.string(),
  body: editorState.nullish(),
});

const siteSettings = z.object({
  siteName: z.string(),
  tagline: z.string().nullish(),
  contactHeading: z.string().nullish(),
  contactIntro: z.string().nullish(),
  meetingAddress: z.string(),
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
    select: { title: true, body: true },
  });
  const page = pageContent.parse(doc);
  return { title: page.title, body: page.body ?? null };
}

export const getSiteSettings = cache(async (locale: Locale): Promise<SiteSettings> => {
  const doc = await (await cms()).findGlobal({ slug: "site-settings", locale, depth: 0 });
  const settings = siteSettings.parse(doc);
  return {
    siteName: settings.siteName,
    tagline: settings.tagline ?? "",
    contactHeading: settings.contactHeading ?? "",
    contactIntro: settings.contactIntro ?? "",
    meetingAddress: settings.meetingAddress,
    contactEmail: settings.contactEmail || null,
  };
});
