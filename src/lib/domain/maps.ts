// A link to an address on OpenStreetMap. The site links to the map instead of
// embedding one, because an embedded map loads a third-party page that sets
// cookies without consent.
export function openStreetMapUrl(address: string): string {
  const url = new URL("https://www.openstreetmap.org/search");
  url.searchParams.set("query", address);
  return url.href;
}
