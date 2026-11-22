// Adds events read from the weekly announcement email to the live site as
// drafts, through Payload's REST API. An event whose importKey is already
// there is left alone, so running the same week twice adds nothing.
//
//   SITE_URL=https://gemeindeinfrankfurt.de PAYLOAD_API_KEY=… \
//     npm run events:import -- events.json
//
// The file holds a JSON array of events in the shape of `importedEvent`.
import { readFile } from "node:fs/promises";

import { z } from "zod";

import { importedEvents, type ImportedEvent } from "@/lib/domain/event-import";

const env = z
  .object({
    SITE_URL: z.url().default("https://gemeindeinfrankfurt.de"),
    PAYLOAD_API_KEY: z.string().min(1),
  })
  .parse(process.env);

const api = `${env.SITE_URL.replace(/\/$/, "")}/api/events`;
const headers = {
  Authorization: `users API-Key ${env.PAYLOAD_API_KEY}`,
  "Content-Type": "application/json",
};

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

async function add(event: ImportedEvent): Promise<void> {
  const shared = {
    startsAt: event.startsAt,
    endsAt: event.endsAt ?? null,
    allDay: event.allDay,
    link: event.link ?? null,
    importKey: event.importKey,
  };
  const { doc } = created.parse(
    await call(`${api}?locale=de&draft=true`, {
      method: "POST",
      body: JSON.stringify({ ...shared, ...event.de, _status: "draft" }),
    }),
  );
  // One locale at a time: two draft saves at once each start from the same
  // version, and the later one drops the other's text.
  const translate = (locale: "en" | "ru") =>
    call(`${api}/${doc.id}?locale=${locale}&draft=true`, {
      method: "PATCH",
      body: JSON.stringify({ ...event[locale], _status: "draft" }),
    });
  await translate("en");
  await translate("ru");
}

const file = process.argv.at(-1);
if (!file?.endsWith(".json")) throw new Error("Pass the path of a .json file of events.");
const events = importedEvents.parse(JSON.parse(await readFile(file, "utf8")));
const results = await Promise.all(
  events.map(async (event) => {
    if (await exists(event.importKey)) return `skipped ${event.importKey} (already there)`;
    await add(event);
    return `added ${event.importKey} as a draft`;
  }),
);
process.stdout.write(`${results.join("\n")}\n`);
