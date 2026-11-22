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

const found = z.object({ totalDocs: z.number() });
const created = z.object({ doc: z.object({ id: z.union([z.number(), z.string()]) }) });

async function call(url: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function exists(importKey: string): Promise<boolean> {
  const query = new URLSearchParams({
    "where[importKey][equals]": importKey,
    draft: "true",
    limit: "1",
    depth: "0",
  });
  return found.parse(await call(`${api}?${query}`)).totalDocs > 0;
}

function localized(text: ImportedAnnouncement["de"]) {
  return {
    title: text.title,
    body: convertMarkdownToLexical({ editorConfig, markdown: text.markdown }),
    _status: "draft",
  };
}

async function add(week: ImportedAnnouncement): Promise<void> {
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
  // One locale at a time: two draft saves at once each start from the same
  // version, and the later one drops the other's text.
  const translate = (locale: "en" | "ru") =>
    call(`${api}/${doc.id}?locale=${locale}&draft=true`, {
      method: "PATCH",
      body: JSON.stringify(localized(week[locale])),
    });
  await translate("en");
  await translate("ru");
}

const file = process.argv.at(-1);
if (!file?.endsWith(".json")) throw new Error("Pass the path of a .json file of announcements.");
const weeks = importedAnnouncements.parse(JSON.parse(await readFile(file, "utf8")));
const results = await Promise.all(
  weeks.map(async (week) => {
    if (await exists(week.importKey)) return `skipped ${week.importKey} (already there)`;
    await add(week);
    return `added ${week.importKey} as a draft`;
  }),
);
process.stdout.write(`${results.join("\n")}\n`);
