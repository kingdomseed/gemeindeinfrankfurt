const berlinDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// The earliest "show until" value that still counts as not ended. The CMS
// stores a chosen day as a time on that day in UTC, so an announcement stays
// up through the whole of its last day in Frankfurt when its value is at or
// after the start (UTC) of today's Frankfurt date.
export function earliestOpenEndDate(now: Date): string {
  return `${berlinDate.format(now)}T00:00:00.000Z`;
}

const berlinMonth = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
});

// Items under the Frankfurt month ("2026-11") they fall in, keeping the order
// they came in: months in order of their first item, items in their order.
export function groupByMonth<Item>(
  items: readonly Item[],
  dateOf: (item: Item) => Date,
): { month: string; items: Item[] }[] {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const month = berlinMonth.format(dateOf(item));
    groups.set(month, [...(groups.get(month) ?? []), item]);
  }
  return [...groups].map(([month, grouped]) => ({ month, items: grouped }));
}

// The id of a month's section on the announcements page.
export function monthAnchor(month: string): string {
  return `month-${month}`;
}

// A day in the middle of a month ("2026-11"), for formatting its name.
export function midMonth(month: string): Date {
  return new Date(`${month}-15T12:00:00Z`);
}

// A month's name with a capital first letter, as Russian writes it lower case
// ("ноябрь") but a heading or button starts with a capital.
export function capitalized(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}
