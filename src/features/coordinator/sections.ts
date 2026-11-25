import type { SectionKey } from "@/lib/domain/links";

export type { SectionKey };

// The coordinator pages in the order the section links show them.
export const coordinatorSections = [
  { key: "overview", href: "/training/coordinator" },
  { key: "registrations", href: "/training/coordinator/registrations" },
  { key: "outlines", href: "/training/coordinator/outlines" },
  { key: "groups", href: "/training/coordinator/groups" },
  { key: "attendance", href: "/training/coordinator/attendance" },
  { key: "messages", href: "/training/coordinator/messages" },
  { key: "testing", href: "/training/coordinator/testing" },
  { key: "services", href: "/training/coordinator/services" },
  { key: "emails", href: "/training/coordinator/emails" },
  { key: "report", href: "/training/coordinator/report" },
  { key: "setup", href: "/training/coordinator/setup" },
] as const satisfies readonly { key: SectionKey; href: string }[];

export function sectionHref(key: SectionKey) {
  return coordinatorSections.find((s) => s.key === key)?.href ?? coordinatorSections[0].href;
}

export function normalizeCoordinatorPath(pathname: string): string {
  const stripped = pathname.replace(/^\/(de|en|ru)(?=\/|$)/, "").replace(/\/+$/, "");
  return stripped || "/";
}

const fullScreenSuffixes = ["/screen", "/questionnaire", "/name-tags"];

// Maps a coordinator URL path to its space section, or null on print/screen views.
export function sectionFromPath(pathname: string): SectionKey | null {
  const path = normalizeCoordinatorPath(pathname);
  if (fullScreenSuffixes.some((suffix) => path.endsWith(suffix))) return null;
  if (path === "/training/coordinator") return "overview";
  for (const s of coordinatorSections) {
    if (s.key !== "overview" && (path === s.href || path.startsWith(`${s.href}/`))) return s.key;
  }
  return null;
}

// Pages reached from a section rather than from the section links.
export const teamHref = "/training/coordinator/setup/team";
export const nameTagsHref = "/training/coordinator/groups/name-tags";

// Taking attendance for one message, on a phone.
export function attendanceHref(messageNumber: number, group?: number | null) {
  const path = `${sectionHref("attendance")}/${messageNumber}`;
  return group ? `${path}?group=${group}` : path;
}

// One message's hymns and verses, and its slides for the room's screen.
export function messageHref(messageNumber: number) {
  return `${sectionHref("messages")}/${messageNumber}`;
}
export function screenHref(messageNumber: number) {
  return `${messageHref(messageNumber)}/screen`;
}

// The registrations page, opened on a filter or a search.
export function registrationsHref(open?: { show?: "unpaid"; q?: string }) {
  const params = new URLSearchParams(open);
  const query = params.toString();
  const href = sectionHref("registrations");
  return query ? `${href}?${query}` : href;
}
