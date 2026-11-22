// Adds weekly announcements read from the announcement email to the live site
// as drafts, through Payload's REST API. A week whose importKey is already
// there is left alone, so running the same file twice adds nothing.
//
//   SITE_URL=https://gemeindeinfrankfurt.de PAYLOAD_API_KEY=… \
//     npm run announcements:import -- announcements.json
//
// The file holds a JSON array in the shape of `importedAnnouncement`.
import { readFile } from "node:fs/promises";

import config from "@payload-config";
import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import { z } from "zod";

import { importedAnnouncements, type ImportedAnnouncement } from "@/lib/domain/event-import";

const env = z
  .object({
    SITE_URL: z.url().default("https://gemeindeinfrankfurt.de"),
    PAYLOAD_API_KEY: z.string().min(1),
  })
  .parse(process.env);

const api = `${env.SITE_URL.replace(/\/$/, "")}/api/announcements`;
const headers = {
  Authorization: `users API-Key ${env.PAYLOAD_API_KEY}`,
  "Content-Type": "application/json",
};
const editorConfig = await editorConfigFactory.default({ config: await config });

const id = z.union([z.number(), z.string()]);
const found = z.object({ docs: z.array(z.object({ id, title: z.string().nullish() })) });
const created = z.object({ doc: z.object({ id }) });

async function call(url: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

// The week's draft in one language, without falling back to German, so a
// missing translation shows up as a missing title.
async function find(importKey: string, locale: "en" | "ru") {
  const query = new URLSearchParams({
    "where[importKey][equals]": importKey,
    locale,
    "fallback-locale": "none",
    draft: "true",
    limit: "1",
    depth: "0",
  });
  return found.parse(await call(`${api}?${query}`)).docs[0];
}

function localized(text: ImportedAnnouncement["de"]) {
  return {
    title: text.title,
    body: convertMarkdownToLexical({ editorConfig, markdown: text.markdown }),
    _status: "draft",
  };
}

async function create(week: ImportedAnnouncement) {
  const { doc } = created.parse(
    await call(`${api}?locale=de&draft=true`, {
      method: "POST",
      body: JSON.stringify({
        ...localized(week.de),
        publishedAt: week.publishedAt,
        showUntil: week.showUntil ?? null,
        importKey: week.importKey,
      }),
    }),
  );
  return doc.id;
}

// Adds the week, or finishes one an earlier run left without a translation.
// A week that has all three languages is left alone.
async function importWeek(week: ImportedAnnouncement): Promise<string> {
  const [en, ru] = [await find(week.importKey, "en"), await find(week.importKey, "ru")];
  const existing = en ?? ru;
  const docId = existing?.id ?? (await create(week));
  // One locale at a time: two draft saves at once each start from the same
  // version, and the later one drops the other's text.
  const missing = (["en", "ru"] as const).filter(
    (locale) => !existing || !(locale === "en" ? en : ru)?.title,
  );
  for (const locale of missing) {
    // oxlint-disable-next-line no-await-in-loop -- parallel draft saves drop each other's text
    await call(`${api}/${docId}?locale=${locale}&draft=true`, {
      method: "PATCH",
      body: JSON.stringify(localized(week[locale])),
    });
  }
  if (!existing) return `added ${week.importKey} as a draft`;
  if (missing.length > 0) return `finished ${week.importKey} (${missing.join(", ")})`;
  return `skipped ${week.importKey} (already there)`;
}

const file = process.argv.at(-1);
if (!file?.endsWith(".json")) throw new Error("Pass the path of a .json file of announcements.");
const weeks = importedAnnouncements.parse(JSON.parse(await readFile(file, "utf8")));
const results = await Promise.all(weeks.map(importWeek));
process.stdout.write(`${results.join("\n")}\n`);
