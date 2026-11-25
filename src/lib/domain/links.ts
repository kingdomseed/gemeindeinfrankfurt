export const spaceSections = [
  "overview",
  "registrations",
  "outlines",
  "groups",
  "attendance",
  "messages",
  "testing",
  "services",
  "emails",
  "report",
  "setup",
] as const;

export type SectionKey = (typeof spaceSections)[number];

export type LinkKind = "google_doc" | "google_sheet" | "google_slides" | "google_drive" | "link";

// Accepts only https:// URLs with a non-empty host (so javascript:, data: and
// http: links are rejected at the boundary).
export function parseExternalLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  const parsed = URL.parse(trimmed);
  if (parsed?.protocol !== "https:" || !parsed.hostname) return null;
  if (!parsed.hostname.includes(".")) return null;
  if (parsed.href.length > 2000) return null;
  return parsed.href;
}

export function detectLinkKind(url: string): LinkKind {
  const parsed = URL.parse(url);
  if (!parsed) return "link";
  const host = parsed.hostname.toLowerCase();
  if (host === "docs.google.com") {
    if (parsed.pathname.startsWith("/document/")) return "google_doc";
    if (parsed.pathname.startsWith("/spreadsheets/")) return "google_sheet";
    if (parsed.pathname.startsWith("/presentation/")) return "google_slides";
  }
  if (host === "drive.google.com") return "google_drive";
  return "link";
}

const GOOGLE_TITLES: Readonly<Record<Exclude<LinkKind, "link">, string>> = {
  google_doc: "Google Doc",
  google_sheet: "Google Sheet",
  google_slides: "Google Slides",
  google_drive: "Google Drive",
};

export function defaultLinkTitle(url: string, kind: LinkKind): string {
  if (kind !== "link") return GOOGLE_TITLES[kind];
  const host = URL.parse(url)?.hostname ?? "";
  return host.replace(/^www\./, "") || url;
}
