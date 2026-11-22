import { z } from "zod";

// One event read from the weekly announcement email, in all three languages,
// as the weekly import hands it to scripts/import-events.ts.

const text = z.object({
  title: z.string().trim().min(1),
  location: z.string().trim().optional(),
  details: z.string().trim().optional(),
});

// Mailchimp adds the reader's subscriber id (`e=`) to every link; it must
// not end up on the public site.
export function withoutTracking(link: string): string {
  const url = new URL(link);
  url.searchParams.delete("e");
  return url.toString();
}

export const importedEvent = z.object({
  importKey: z.string().regex(/^[a-z0-9-]+$/),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).optional(),
  allDay: z.boolean().default(false),
  link: z
    .url({ protocol: /^https$/ })
    .transform(withoutTracking)
    .optional(),
  de: text,
  en: text,
  ru: text,
});

export type ImportedEvent = z.infer<typeof importedEvent>;

export const importedEvents = z.array(importedEvent);

// Drops the subscriber id from every link in a piece of Markdown.
export function textWithoutTracking(markdown: string): string {
  return markdown.replace(/https?:\/\/[^\s)\]>"]+/g, (link) =>
    URL.canParse(link) ? withoutTracking(link) : link,
  );
}

const announcementText = z.object({
  title: z.string().trim().min(1),
  markdown: z
    .string()
    .trim()
    .min(1)
    .refine(
      (markdown) => !/zoom\.us/i.test(markdown),
      "Zoom links stay out of public announcements.",
    )
    .transform(textWithoutTracking),
});

// One week's announcement email, condensed to its key details in all three
// languages, as the weekly import hands it to scripts/import-announcements.ts.
export const importedAnnouncement = z.object({
  importKey: z.string().regex(/^[a-z0-9-]+$/),
  publishedAt: z.iso.datetime({ offset: true }),
  // The last day it shows, as a date. Stored as midnight UTC of that day, the
  // way the admin's day picker stores it and `earliestOpenEndDate` reads it.
  showUntil: z.iso
    .date()
    .transform((day) => `${day}T00:00:00.000Z`)
    .optional(),
  de: announcementText,
  en: announcementText,
  ru: announcementText,
});

export type ImportedAnnouncement = z.infer<typeof importedAnnouncement>;

export const importedAnnouncements = z.array(importedAnnouncement);
