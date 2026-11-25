import type { LocalityOption } from "./types";

// Home locality first, then neighboring cities in German alphabetical order.
export function sortLocalities(localities: readonly LocalityOption[]): LocalityOption[] {
  return localities.toSorted((a, b) => {
    if (a.is_home !== b.is_home) return a.is_home ? -1 : 1;
    return a.name.localeCompare(b.name, "de");
  });
}

// The registrant's city for display, whether chosen from the training's list or
// entered under "Other".
export function displayLocality(r: {
  localities: { name: string } | null;
  other_locality: string;
}): string | null {
  if (r.localities) return r.localities.name;
  const other = r.other_locality.trim();
  return other || null;
}

// Validates and normalizes the submitted locality against the training's curated
// localities. Typing an existing city under "Other" maps back to its row so the
// registration table and report do not split one city in two. Returns null when
// invalid.
export function resolveLocalityInput(
  localityId: string | null,
  otherLocality: string,
  localities: readonly LocalityOption[],
): { locality_id: string | null; other_locality: string } | null {
  if (localityId !== null) {
    return localities.some((l) => l.id === localityId)
      ? { locality_id: localityId, other_locality: "" }
      : null;
  }
  const trimmed = otherLocality.trim();
  if (!trimmed) return null;
  const matched = localities.find((l) => l.name.toLowerCase() === trimmed.toLowerCase());
  return matched
    ? { locality_id: matched.id, other_locality: "" }
    : { locality_id: null, other_locality: trimmed };
}
