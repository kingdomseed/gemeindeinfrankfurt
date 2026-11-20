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
