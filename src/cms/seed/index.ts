import { readFile } from "node:fs/promises";
import path from "node:path";

import config from "@payload-config";
import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import { getPayload } from "payload";

import { locales, type Locale } from "@/i18n/routing";
import { openStreetMapUrl } from "@/lib/domain/maps";

import { parsePageFile, toEditorMarkdown, type PageFile } from "./markdown";

// Loads the church's pages and site settings into Payload: German and English
// word for word from the recovered WordPress site, Russian from the
// translations next to this file. Running it again updates the same pages.
// Run with `npm run seed:cms`.

const archive = path.resolve(process.cwd(), "archive/wordpress-2022/content");
const translations = path.resolve(process.cwd(), "src/cms/seed/ru");

type PageSeed = {
  navOrder: number;
  isHome: boolean;
  sources: Record<Locale, { file: string; slug: string }>;
};

const pages: PageSeed[] = [
  {
    navOrder: 1,
    isHome: true,
    sources: {
      de: { file: `${archive}/de/startseite.md`, slug: "uber-uns" },
      en: { file: `${archive}/en/home.md`, slug: "about-us" },
      ru: { file: `${translations}/o-nas.md`, slug: "o-nas" },
    },
  },
  {
    navOrder: 2,
    isHome: false,
    sources: {
      de: { file: `${archive}/de/fur-besucher.md`, slug: "fur-besucher" },
      en: { file: `${archive}/en/for-visitors.md`, slug: "for-visitors" },
      ru: { file: `${translations}/dlya-posetiteley.md`, slug: "dlya-posetiteley" },
    },
  },
  {
    navOrder: 3,
    isHome: false,
    sources: {
      de: { file: `${archive}/de/unser-glaube.md`, slug: "unser-glaube" },
      en: { file: `${archive}/en/our-belief.md`, slug: "our-belief" },
      ru: { file: `${translations}/nasha-vera.md`, slug: "nasha-vera" },
    },
  },
];

// The old site's header. Its English header said "Just another die Gemeinde
// in Frankfurt site" (WordPress's default), so English and Russian translate
// the German tagline instead.
const header: Record<Locale, { siteName: string; tagline: string }> = {
  de: { siteName: "die Gemeinde in Frankfurt", tagline: "Christus in uns (Kol: 1:27)" },
  en: { siteName: "The Church in Frankfurt", tagline: "Christ in us (Col. 1:27)" },
  ru: { siteName: "Церковь во Франкфурте", tagline: "Христос в нас (Кол. 1:27)" },
};

const meetingAddress = "Ginnheimer Stadtweg 120, 60431 Frankfurt am Main";

const payload = await getPayload({ config });
const editorConfig = await editorConfigFactory.default({ config: payload.config });

async function readPage(file: string): Promise<PageFile> {
  return parsePageFile(await readFile(file, "utf8"));
}

function toRichText(markdown: string) {
  return convertMarkdownToLexical({
    editorConfig,
    markdown: toEditorMarkdown(markdown, openStreetMapUrl),
  });
}

// All languages of a page, and of the site settings, are stored on one
// document, so its writes go one language at a time.
async function forEachLocale(write: (locale: Locale) => Promise<void>) {
  for (const locale of locales) {
    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- writes to the same document must not overlap.
    await write(locale);
  }
}

async function seedPage(page: PageSeed) {
  const [files, existing] = await Promise.all([
    Promise.all(
      locales.map(async (locale) => [locale, await readPage(page.sources[locale].file)] as const),
    ),
    payload.find({
      collection: "pages",
      locale: "de",
      where: { slug: { equals: page.sources.de.slug } },
      limit: 1,
      depth: 0,
    }),
  ]);
  const byLocale = new Map(files);
  let id = existing.docs[0]?.id;

  await forEachLocale(async (locale) => {
    const file = byLocale.get(locale);
    if (!file) throw new Error(`No ${locale} file for ${page.sources.de.slug}`);
    const data = {
      title: file.title,
      slug: page.sources[locale].slug,
      body: toRichText(file.body),
      navOrder: page.navOrder,
      isHome: page.isHome,
    };
    if (id === undefined) {
      id = (await payload.create({ collection: "pages", locale, data, depth: 0 })).id;
    } else {
      await payload.update({ collection: "pages", id, locale, data, depth: 0 });
    }
    payload.logger.info(`Seeded page ${locale}/${data.slug}`);
  });
}

// The contact panel text comes from the home page's sidebar. The contact
// email is left as it is: the church has not chosen which address to publish.
async function seedSiteSettings() {
  const home = pages.find((page) => page.isHome);
  if (!home) throw new Error("No home page in the seed");
  await forEachLocale(async (locale) => {
    const { contact } = await readPage(home.sources[locale].file);
    await payload.updateGlobal({
      slug: "site-settings",
      locale,
      data: {
        ...header[locale],
        contactHeading: contact?.heading ?? "",
        contactIntro: contact?.intro ?? "",
        meetingAddress,
      },
    });
    payload.logger.info(`Seeded site settings (${locale})`);
  });
}

await Promise.all([...pages.map(seedPage), seedSiteSettings()]);
await payload.destroy();
