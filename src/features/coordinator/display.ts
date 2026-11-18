import type { RegistrationRow } from "./types";

// "First Last", plus the partner on a shared seat.
export function displayName({ registration: r }: RegistrationRow) {
  const partner =
    r.seat_type === "shared" ? ` + ${r.partner_first_name} ${r.partner_last_name}` : "";
  return `${r.first_name} ${r.last_name}${partner}`;
}

// "GROUP / OUTLINE", plus a second outline language. Anaheim attendees order
// no outline, so theirs is just "GROUP".
export function displayLanguages({ registration: r }: RegistrationRow) {
  const group = r.group_language.toUpperCase();
  if (!r.outline_language) return group;
  const second = r.second_outline_language ? ` + ${r.second_outline_language.toUpperCase()}` : "";
  return `${group} / ${r.outline_language.toUpperCase()}${second}`;
}
