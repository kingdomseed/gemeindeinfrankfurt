type Named = {
  seat_type: string;
  first_name: string;
  last_name: string;
  partner_first_name: string | null;
  partner_last_name: string | null;
};

// "First Last", plus the partner on a shared seat.
export function displayName(r: Named) {
  const partner =
    r.seat_type === "shared" ? ` + ${r.partner_first_name} ${r.partner_last_name}` : "";
  return `${r.first_name} ${r.last_name}${partner}`;
}

// "GROUP / OUTLINE", plus a second outline language. Anaheim attendees order
// no outline, so theirs is just "GROUP".
export function displayLanguages(r: {
  group_language: string;
  outline_language: string | null;
  second_outline_language: string | null;
}) {
  const group = r.group_language.toUpperCase();
  if (!r.outline_language) return group;
  const second = r.second_outline_language ? ` + ${r.second_outline_language.toUpperCase()}` : "";
  return `${group} / ${r.outline_language.toUpperCase()}${second}`;
}

export function detailHref(id: string) {
  return `/training/coordinator/registrations/${id}`;
}
