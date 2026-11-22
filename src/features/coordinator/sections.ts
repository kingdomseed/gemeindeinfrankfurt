// The coordinator pages in the order the section links show them.
export const coordinatorSections = [
  { key: "overview", href: "/training/coordinator" },
  { key: "registrations", href: "/training/coordinator/registrations" },
  { key: "outlines", href: "/training/coordinator/outlines" },
  { key: "groups", href: "/training/coordinator/groups" },
  { key: "testing", href: "/training/coordinator/testing" },
  { key: "services", href: "/training/coordinator/services" },
  { key: "setup", href: "/training/coordinator/setup" },
] as const;

export type SectionKey = (typeof coordinatorSections)[number]["key"];

export function sectionHref(key: SectionKey) {
  return coordinatorSections.find((s) => s.key === key)?.href ?? coordinatorSections[0].href;
}

// Pages reached from a section rather than from the section links.
export const teamHref = "/training/coordinator/setup/team";
export const nameTagsHref = "/training/coordinator/groups/name-tags";

// The registrations page, opened on a filter or a search.
export function registrationsHref(open?: { show?: "unpaid"; q?: string }) {
  const params = new URLSearchParams(open);
  const query = params.toString();
  const href = sectionHref("registrations");
  return query ? `${href}?${query}` : href;
}
