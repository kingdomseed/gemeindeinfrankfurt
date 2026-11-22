// The coordinator pages in the order the section links show them.
export const coordinatorSections = [
  { key: "overview", href: "/training/coordinator" },
  { key: "registrations", href: "/training/coordinator/registrations" },
  { key: "outlines", href: "/training/coordinator/outlines" },
  { key: "setup", href: "/training/coordinator/setup" },
] as const;

// Who can sign in. Reached from the setup page, so it sits below it.
export const teamHref = "/training/coordinator/setup/team";

// The registrations page, opened on a filter or a search.
export function registrationsHref(open?: { show?: "unpaid"; q?: string }) {
  const params = new URLSearchParams(open);
  const query = params.toString();
  return query ? `${coordinatorSections[1].href}?${query}` : coordinatorSections[1].href;
}
