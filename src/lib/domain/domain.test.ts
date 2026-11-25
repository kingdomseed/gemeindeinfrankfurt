import { describe, expect, it } from "vitest";

import { earliestOpenEndDate, groupByMonth } from "./announcements";
import { canCancel, canRegister, computeCutoffs, endOfBerlinDay } from "./cutoffs";
import { importedAnnouncement, importedEvent } from "./event-import";
import { eventWhen, startOfBerlinToday } from "./events";
import { computeFees, parseEuroCents } from "./fees";
import { buildCalendar } from "./ics";
import { openStreetMapUrl } from "./maps";
import { countOutlines } from "./outlines";
import {
  firstParagraph,
  firstSectionHeadlines,
  fromCapitals,
  splitFirstSentence,
  withoutFirstParagraph,
} from "./rich-text";
import {
  berlinDate,
  berlinDay,
  berlinDayTime,
  isBerlinWeekday,
  scheduleDays,
  sessionFormatDays,
  sessionLabel,
  trainingDates,
  trainingDateSpan,
} from "./sessions";
import { sitemapEntries } from "./sitemap";
import { hashToken, newEditToken } from "./token";
import { picksSessions, seatTypes } from "./types";

const prices = { feeCents: 7000, outlinePriceCents: 500 };
const base = {
  seatType: "full_time" as const,
  outlineLanguage: "de" as const,
  secondOutlineLanguage: null,
};

describe("computeFees", () => {
  it("charges one fee per seat plus one outline", () => {
    expect(computeFees(base, prices)).toEqual({
      trainingCents: 7000,
      outlineCents: 500,
      outlineCount: 1,
      waived: false,
    });
  });

  it("charges a shared seat once", () => {
    expect(computeFees({ ...base, seatType: "shared" }, prices).trainingCents).toBe(7000);
  });

  it("waives the fee but not the outlines", () => {
    const fees = computeFees(
      { ...base, hardshipWaiver: true, secondOutlineLanguage: "ru" },
      prices,
    );
    expect(fees.trainingCents).toBe(0);
    expect(fees.outlineCents).toBe(1000);
  });

  it("charges an Anaheim seat nothing and orders no outline", () => {
    expect(computeFees({ ...base, seatType: "anaheim", outlineLanguage: null }, prices)).toEqual({
      trainingCents: 0,
      outlineCents: 0,
      outlineCount: 0,
      waived: true,
    });
  });
});

describe("parseEuroCents", () => {
  it("reads euros with a comma, a point, or a euro sign", () => {
    expect(parseEuroCents("70")).toBe(7000);
    expect(parseEuroCents("70,00")).toBe(7000);
    expect(parseEuroCents("€ 5.5")).toBe(550);
    expect(parseEuroCents("19,90")).toBe(1990);
    expect(parseEuroCents("19.9")).toBe(1990);
    expect(parseEuroCents(" 320 € ")).toBe(32_000);
  });

  it("rejects anything else", () => {
    expect(parseEuroCents("")).toBeNull();
    expect(parseEuroCents("-5")).toBeNull();
    expect(parseEuroCents("1.000,00")).toBeNull();
    expect(parseEuroCents("1.234,50")).toBeNull();
    expect(parseEuroCents("abc")).toBeNull();
  });
});

describe("cutoffs", () => {
  // First message on a January evening in Frankfurt (CET, UTC+1).
  const sessions = [
    {
      id: "2",
      message_number: 2,
      starts_at: "2027-01-08T18:00:00Z",
      ends_at: "2027-01-08T20:30:00Z",
    },
    {
      id: "1",
      message_number: 1,
      starts_at: "2027-01-05T18:00:00Z",
      ends_at: "2027-01-05T20:30:00Z",
    },
  ];

  it("locks changes at the first session", () => {
    expect(computeCutoffs(sessions)?.seatAndSessionsLockAt.toISOString()).toBe(
      "2027-01-05T18:00:00.000Z",
    );
    expect(canCancel(sessions, new Date("2027-01-05T17:59:00Z"))).toBe(true);
    expect(canCancel(sessions, new Date("2027-01-05T18:00:00Z"))).toBe(false);
  });

  it("closes registration at the end of the first day in Berlin", () => {
    expect(canRegister(sessions, new Date("2027-01-05T22:30:00Z"))).toBe(true);
    expect(canRegister(sessions, new Date("2027-01-05T23:00:00Z"))).toBe(false);
  });

  it("handles summer time", () => {
    expect(endOfBerlinDay(new Date("2027-07-06T10:00:00Z")).toISOString()).toBe(
      "2027-07-06T21:59:59.999Z",
    );
  });
});

describe("countOutlines", () => {
  it("counts second outlines", () => {
    expect(
      countOutlines([
        { outline_language: "de", second_outline_language: "en" },
        { outline_language: "ru", second_outline_language: null },
        { outline_language: "de", second_outline_language: null },
        { outline_language: null, second_outline_language: null },
      ]),
    ).toEqual({ de: 2, en: 1, ru: 1 });
  });
});

describe("picksSessions", () => {
  it("lets part-time and Anaheim seats choose messages", () => {
    expect(seatTypes.filter(picksSessions)).toEqual(["part_time", "anaheim"]);
  });
});

describe("edit token", () => {
  it("stores only a hash", () => {
    const { token, hash } = newEditToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
  });
});

describe("sessionLabel", () => {
  it("shows Berlin time in the page's language", () => {
    const session = { id: "s1", message_number: 1, starts_at: "2026-12-26T08:00:00Z", ends_at: "" };
    expect(sessionLabel(session, "en", "Message 1", "Lord's Day")).toBe(
      "Message 1: Sat, Dec 26, 09:00 AM",
    );
  });

  it("shows start and end time ranges across locales and calls Sunday Lord's Day", () => {
    const tuesday = {
      id: "s1",
      message_number: 1,
      starts_at: "2027-01-12T18:00:00Z",
      ends_at: "2027-01-12T20:30:00Z",
    };
    const sunday = {
      id: "s5",
      message_number: 5,
      starts_at: "2027-01-17T08:45:00Z",
      ends_at: "2027-01-17T11:15:00Z",
    };
    expect(sessionLabel(tuesday, "en", "Message 1", "Lord's Day")).toBe(
      "Message 1: Tue, Jan 12, 7:00 – 9:30 PM",
    );
    expect(sessionLabel(sunday, "en", "Message 5", "Lord's Day")).toBe(
      "Message 5: Lord's Day, Jan 17, 9:45 AM – 12:15 PM",
    );
    expect(sessionLabel(sunday, "de", "Botschaft 5", "Tag des Herrn")).toBe(
      "Botschaft 5: Tag des Herrn, 17. Jan., 09:45–12:15 Uhr",
    );
    expect(sessionLabel(sunday, "ru", "Весть 5", "День Господень")).toBe(
      "Весть 5: День Господень, 17 янв., 09:45–12:15",
    );
  });
});

const sessionAt = (id: string, n: number, startsAt: string) => ({
  id,
  message_number: n,
  starts_at: startsAt,
  ends_at: "",
});

describe("scheduleDays", () => {
  it("groups messages by the Frankfurt calendar day, in time order", () => {
    const days = scheduleDays(
      [
        sessionAt("b", 2, "2027-01-09T10:15:00Z"),
        sessionAt("a", 1, "2027-01-09T08:30:00Z"),
        // 00:30 on 10 January in Frankfurt, although still 9 January in UTC.
        sessionAt("c", 3, "2027-01-09T23:30:00Z"),
      ],
      "en-GB",
      "Lord's Day",
    );
    expect(days.map((d) => d.key)).toEqual(["2027-01-09", "2027-01-10"]);
    expect(days[0]?.label).toBe("Saturday 9 January");
    expect(days[0]?.sessions).toEqual([
      { id: "a", number: 1, time: "09:30" },
      { id: "b", number: 2, time: "11:15" },
    ]);
    expect(days[1]?.sessions.map((s) => s.number)).toEqual([3]);
  });

  it("formats start and end time ranges across locales when ends_at is present", () => {
    const tuesday = {
      id: "s1",
      message_number: 1,
      starts_at: "2027-01-12T18:00:00Z",
      ends_at: "2027-01-12T20:30:00Z",
    };
    const sunday = {
      id: "s5",
      message_number: 5,
      starts_at: "2027-01-17T08:45:00Z",
      ends_at: "2027-01-17T11:15:00Z",
    };
    const enDays = scheduleDays([tuesday, sunday], "en", "Lord's Day");
    expect(enDays[0]?.sessions[0]?.time).toBe("7:00 – 9:30 PM");
    expect(enDays[1]?.label.startsWith("Lord's Day")).toBe(true);
    expect(enDays[1]?.sessions[0]?.time).toBe("9:45 AM – 12:15 PM");

    const deDays = scheduleDays([tuesday, sunday], "de", "Tag des Herrn");
    expect(deDays[0]?.sessions[0]?.time).toBe("19:00–21:30 Uhr");
    expect(deDays[1]?.sessions[0]?.time).toBe("09:45–12:15 Uhr");

    const ruDays = scheduleDays([tuesday, sunday], "ru", "День Господень");
    expect(ruDays[0]?.sessions[0]?.time).toBe("19:00–21:30");
    expect(ruDays[1]?.sessions[0]?.time).toBe("09:45–12:15");

    const gbDays = scheduleDays([tuesday], "en-GB", "Lord's Day");
    expect(gbDays[0]?.sessions[0]?.time).toBe("19:00–21:30");
  });

  it("returns no days for an empty schedule", () => {
    expect(scheduleDays([], "en", "Lord's Day")).toEqual([]);
  });
});

describe("berlinDay and berlinDayTime", () => {
  it("names the day and time in Frankfurt in the reader's language", () => {
    const instant = new Date("2027-01-09T08:30:00Z");
    expect(berlinDay(instant, "de", "Tag des Herrn")).toBe("Samstag, 9. Januar");
    expect(berlinDayTime(instant, "en-GB", "Lord's Day")).toBe("Saturday 9 January at 09:30");
  });

  it("calls Sunday the Lord's Day", () => {
    const sunday = new Date("2027-01-17T08:45:00Z");
    expect(berlinDay(sunday, "de", "Tag des Herrn")).toBe("Tag des Herrn, 17. Januar");
    expect(berlinDayTime(sunday, "en-GB", "Lord's Day")).toBe("Lord's Day 17 January at 09:45");
  });
});

describe("openStreetMapUrl", () => {
  it("searches OpenStreetMap for the address", () => {
    const url = new URL(openStreetMapUrl("Ginnheimer Stadtweg 120, 60431 Frankfurt am Main"));
    expect(url.origin + url.pathname).toBe("https://www.openstreetmap.org/search");
    expect(url.searchParams.get("query")).toBe("Ginnheimer Stadtweg 120, 60431 Frankfurt am Main");
  });
});

describe("earliestOpenEndDate", () => {
  // The CMS stores an end date picked as 20 November as noon UTC on that day.
  const pickedNov20 = "2026-11-20T12:00:00.000Z";

  it("keeps an announcement up until the end of its last day in Frankfurt", () => {
    const lateEvening = new Date("2026-11-20T22:30:00Z");
    expect(pickedNov20 >= earliestOpenEndDate(lateEvening)).toBe(true);
  });

  it("ends it once the next day has begun in Frankfurt", () => {
    const justAfterMidnight = new Date("2026-11-20T23:05:00Z");
    expect(earliestOpenEndDate(justAfterMidnight)).toBe("2026-11-21T00:00:00.000Z");
    expect(pickedNov20 >= earliestOpenEndDate(justAfterMidnight)).toBe(false);
  });
});

describe("trainingDates", () => {
  it("spans the first to the last message day in Frankfurt", () => {
    const dates = trainingDates(
      [sessionAt("b", 12, "2027-01-17T13:00:00Z"), sessionAt("a", 1, "2027-01-09T08:30:00Z")],
      "en-GB",
      "Lord's Day",
    );
    expect(dates).toContain("Saturday 9");
    expect(dates).toContain("Lord's Day 17 January 2027");
  });

  it("is empty without sessions", () => {
    expect(trainingDates([], "en", "Lord's Day")).toBeNull();
  });
});

describe("berlinDate", () => {
  it("names the Frankfurt calendar day without the weekday", () => {
    const lateEvening = new Date("2027-01-12T22:59:59Z");
    expect(berlinDate(lateEvening, "en-GB")).toBe("12 January");
    expect(berlinDate(lateEvening, "ru")).toBe("12 января");
  });
});

describe("trainingDateSpan", () => {
  const sessions = [
    sessionAt("b", 12, "2027-01-24T14:00:00Z"),
    sessionAt("a", 1, "2027-01-12T18:00:00Z"),
  ];

  it("spans the first to the last message day without weekdays", () => {
    expect(trainingDateSpan(sessions, "en-GB")).toMatch(/^12\s?–\s?24 January 2027$/);
    expect(trainingDateSpan(sessions, "de")).toMatch(/^12\.\s?–\s?24\. Januar 2027$/);
  });

  it("is empty without sessions", () => {
    expect(trainingDateSpan([], "de")).toBeNull();
  });
});

describe("buildCalendar", () => {
  const event = {
    uid: "s1@gemeindeinfrankfurt.de",
    title: "Video Training, Message 1",
    startsAt: "2027-01-09T08:30:00.000Z",
    endsAt: "2027-01-09T10:00:00Z",
    location: "Hall; Frankfurt",
  };

  it("writes one event per session in UTC with CRLF lines", () => {
    const ics = buildCalendar("Training", [event], new Date("2026-11-18T12:00:00Z"));
    expect(ics).toContain("\r\nDTSTART:20270109T083000Z\r\n");
    expect(ics).toContain("\r\nDTEND:20270109T100000Z\r\n");
    expect(ics).toContain("\r\nSUMMARY:Video Training\\, Message 1\r\n");
    expect(ics).toContain("\r\nLOCATION:Hall\\; Frankfurt\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("folds lines longer than 75 octets", () => {
    const ics = buildCalendar("Training", [{ ...event, title: "Ж".repeat(60) }], new Date());
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe("sitemapEntries", () => {
  const locales = ["de", "en", "ru"] as const;
  const pages = [
    { isHome: true, slugs: { de: "uber-uns", en: "about-us", ru: "o-nas" } },
    { isHome: false, slugs: { de: "unser-glaube", en: "our-belief" } },
  ];

  it("lists every page in every language, with the home page at the language root", () => {
    const urls = sitemapEntries("https://example.org/", locales, "de", pages, ["privacy"]).map(
      (entry) => entry.url,
    );
    expect(urls).toEqual([
      "https://example.org/",
      "https://example.org/en",
      "https://example.org/ru",
      "https://example.org/unser-glaube",
      "https://example.org/en/our-belief",
      "https://example.org/ru/unser-glaube",
      "https://example.org/privacy",
      "https://example.org/en/privacy",
      "https://example.org/ru/privacy",
    ]);
  });

  it("links each entry to the same page in every language and to the default language", () => {
    const [, english] = sitemapEntries("https://example.org", locales, "de", pages, []);
    expect(english?.languages).toEqual({
      de: "https://example.org/",
      en: "https://example.org/en",
      ru: "https://example.org/ru",
      "x-default": "https://example.org/",
    });
  });
});

describe("startOfBerlinToday", () => {
  it("is midnight in Frankfurt, in winter and in summer", () => {
    expect(startOfBerlinToday(new Date("2026-12-24T23:30:00Z")).toISOString()).toBe(
      "2026-12-24T23:00:00.000Z",
    );
    expect(startOfBerlinToday(new Date("2026-12-24T10:00:00Z")).toISOString()).toBe(
      "2026-12-23T23:00:00.000Z",
    );
    expect(startOfBerlinToday(new Date("2027-07-01T12:00:00Z")).toISOString()).toBe(
      "2027-06-30T22:00:00.000Z",
    );
  });
  it("is today's midnight on the evenings the clocks change", () => {
    // 31 October 2027, 23:30 in Frankfurt, after the clocks went back.
    expect(startOfBerlinToday(new Date("2027-10-31T22:30:00Z")).toISOString()).toBe(
      "2027-10-30T22:00:00.000Z",
    );
    // 28 March 2027, 00:30 and 23:30 in Frankfurt, around the clocks going forward.
    expect(startOfBerlinToday(new Date("2027-03-27T23:30:00Z")).toISOString()).toBe(
      "2027-03-27T23:00:00.000Z",
    );
    expect(startOfBerlinToday(new Date("2027-03-28T21:30:00Z")).toISOString()).toBe(
      "2027-03-27T23:00:00.000Z",
    );
  });
});

describe("eventWhen", () => {
  const start = new Date("2026-12-27T08:45:00Z"); // Lord's Day, 09:45 in Frankfurt
  it("names Sunday the Lord's Day and gives the time", () => {
    expect(eventWhen({ startsAt: start, endsAt: null, allDay: false }, "en-GB", "Lord's Day")).toBe(
      "Lord's Day 27 December at 09:45",
    );
  });
  it("gives an end time on the same day", () => {
    const end = new Date("2026-12-27T11:00:00Z");
    expect(eventWhen({ startsAt: start, endsAt: end, allDay: false }, "en-GB", "Lord's Day")).toBe(
      "Lord's Day 27 December at 09:45–12:00",
    );
  });
  it("gives both days for an event over several days", () => {
    const friday = new Date("2026-12-25T18:00:00Z");
    expect(
      eventWhen({ startsAt: friday, endsAt: start, allDay: false }, "de", "Tag des Herrn"),
    ).toBe("Freitag, 25. Dezember – Tag des Herrn, 27. Dezember");
  });
});

describe("whole-day events", () => {
  const dec13 = new Date("2026-12-12T23:00:00Z"); // midnight in Frankfurt
  it("shows the day without a time", () => {
    expect(eventWhen({ startsAt: dec13, endsAt: null, allDay: true }, "de", "Tag des Herrn")).toBe(
      "Tag des Herrn, 13. Dezember",
    );
  });
  it("covers every day through the last one in the calendar file", () => {
    const ics = buildCalendar(
      "Events",
      [
        {
          uid: "e2",
          title: "Conference",
          startsAt: "2026-12-03T23:00:00Z",
          endsAt: "2026-12-05T23:00:00Z",
          location: "",
          allDay: true,
        },
      ],
      new Date("2026-11-22T12:00:00Z"),
    );
    expect(ics).toContain("\r\nDTSTART;VALUE=DATE:20261204\r\n");
    expect(ics).toContain("\r\nDTEND;VALUE=DATE:20261207\r\n");
  });
});

describe("buildCalendar for events", () => {
  it("leaves out the end when there is none and keeps the details", () => {
    const ics = buildCalendar(
      "Events",
      [
        {
          uid: "e1",
          title: "Conference",
          startsAt: "2026-12-25T18:00:00Z",
          location: "",
          description: "Bring a Bible",
        },
      ],
      new Date("2026-11-22T12:00:00Z"),
    );
    expect(ics).not.toContain("DTEND");
    expect(ics).toContain("\r\nDESCRIPTION:Bring a Bible\r\n");
  });
});

describe("importedEvent", () => {
  const event = {
    importKey: "dach-uni-konferenz-2026-12",
    startsAt: "2026-12-04T00:00:00+01:00",
    endsAt: "2026-12-06T00:00:00+01:00",
    allDay: true,
    link: "https://us.list-manage.com/12dexzTo7HF?e=abc123&c2id=xyz",
    de: { title: "DACH Uni-Konferenz", location: "Gut Elim" },
    en: { title: "DACH university conference", location: "Gut Elim" },
    ru: { title: "Университетская конференция DACH", location: "Gut Elim" },
  };
  it("drops the subscriber id from links", () => {
    expect(importedEvent.parse(event).link).toBe("https://us.list-manage.com/12dexzTo7HF?c2id=xyz");
  });
  it("needs a title in every language", () => {
    expect(importedEvent.safeParse({ ...event, ru: { title: "" } }).success).toBe(false);
  });
});

describe("importedAnnouncement", () => {
  const week = {
    importKey: "ankuendigungen-2026-11-16",
    publishedAt: "2026-11-16T00:00:00+01:00",
    showUntil: "2026-11-22",
    de: {
      title: "Ankündigungen 16.–22. November",
      markdown: "[Anmeldung](https://us.list-manage.com/abc?e=abc123&c2id=xyz)",
    },
    en: {
      title: "Announcements 16–22 November",
      markdown: "Sign up: https://example.org/a?e=abc123",
    },
    ru: { title: "Объявления 16–22 ноября", markdown: "Ссылка: http://example.org/b?e=abc123" },
  };
  it("drops the subscriber id from every link in the text", () => {
    const parsed = importedAnnouncement.parse(week);
    expect(parsed.de.markdown).toBe("[Anmeldung](https://us.list-manage.com/abc?c2id=xyz)");
    expect(parsed.en.markdown).toBe("Sign up: https://example.org/a");
    expect(parsed.ru.markdown).toBe("Ссылка: http://example.org/b");
  });
  it("keeps the last day in the shape the home page compares against", () => {
    const parsed = importedAnnouncement.parse(week);
    expect(parsed.showUntil).toBe("2026-11-22T00:00:00.000Z");
    expect(
      parsed.showUntil && parsed.showUntil >= earliestOpenEndDate(new Date("2026-11-22T22:30:00Z")),
    ).toBe(true);
  });
  it("refuses a Zoom link", () => {
    const withZoom = {
      ...week,
      ru: { title: "Объявления", markdown: "https://us02web.zoom.us/j/1" },
    };
    expect(importedAnnouncement.safeParse(withZoom).success).toBe(false);
  });
});

function paragraph(text: string) {
  return { type: "paragraph", children: [{ type: "text", text }] };
}

describe("rich text excerpts", () => {
  const state = {
    root: {
      type: "root",
      children: [
        { type: "heading", children: [{ type: "text", text: "Title" }] },
        paragraph(""),
        paragraph("First one. Second one."),
        { type: "horizontalrule" },
        paragraph("Later."),
      ],
    },
  };

  it("finds the first non-empty paragraph", () => {
    expect(firstParagraph(state)).toBe("First one. Second one.");
    expect(firstParagraph({ root: { children: [] } })).toBe("");
    expect(firstParagraph(null)).toBe("");
  });

  it("drops the first paragraph and keeps the rest", () => {
    const rest = withoutFirstParagraph(state);
    expect(firstParagraph(rest)).toBe("Later.");
    const onlyOne = { root: { children: [paragraph("Only."), { type: "horizontalrule" }] } };
    expect(withoutFirstParagraph(onlyOne)).toBeNull();
  });

  it("splits text after its first sentence", () => {
    expect(splitFirstSentence("Not our name – our description. As such it includes.")).toEqual({
      head: "Not our name – our description.",
      rest: "As such it includes.",
    });
    expect(splitFirstSentence("One sentence only.")).toEqual({
      head: "One sentence only.",
      rest: "",
    });
  });

  it("turns a heading in capitals into normal case", () => {
    expect(fromCapitals("DIE BIBEL", true)).toBe("Die Bibel");
    expect(fromCapitals("THE TRIUNE GOD", true)).toBe("The Triune God");
    expect(fromCapitals("БИБЛИЯ И ВЕРА", false)).toBe("Библия и вера");
  });
});

function bold(text: string) {
  return { type: "text", format: 1, text };
}

function plain(text: string) {
  return { type: "text", format: 0, text };
}

describe("announcement archive", () => {
  it("groups items by their month in Frankfurt, keeping their order", () => {
    const dates = [
      "2026-11-16T00:00:00+01:00",
      "2026-11-01T00:30:00+01:00",
      "2026-10-31T23:30:00Z",
    ];
    const groups = groupByMonth(dates, (date) => new Date(date));
    expect(groups).toEqual([{ month: "2026-11", items: [dates[0], dates[1], dates[2]] }]);
    const later = groupByMonth(
      ["2026-11-02T00:00:00+01:00", "2026-10-26T00:00:00+01:00"],
      (d) => new Date(d),
    );
    expect(later.map((group) => group.month)).toEqual(["2026-11", "2026-10"]);
  });

  it("lists the bold lead-ins under the first heading", () => {
    const state = {
      root: {
        children: [
          { type: "heading", children: [plain("Important")] },
          { type: "paragraph", children: [bold("Retreat "), plain(" 6–8 March")] },
          { type: "paragraph", children: [plain("Not a headline")] },
          { type: "list", children: [] },
          { type: "paragraph", children: [bold("Gospel bus")] },
          { type: "heading", children: [plain("This week")] },
          { type: "paragraph", children: [bold("Tuesday")] },
        ],
      },
    };
    expect(firstSectionHeadlines(state)).toEqual(["Retreat", "Gospel bus"]);
    expect(firstSectionHeadlines(null)).toEqual([]);
  });
});

describe("isBerlinWeekday & sessionFormatDays", () => {
  it("treats Monday through Friday in Berlin as weekdays and Saturday/Sunday as weekend", () => {
    // Friday 23:30 UTC is already Saturday 00:30 in Berlin (CET).
    expect(isBerlinWeekday(new Date("2027-01-15T18:00:00Z"))).toBe(true);
    expect(isBerlinWeekday(new Date("2027-01-15T23:30:00Z"))).toBe(false);
    // Sunday 23:30 UTC is already Monday 00:30 in Berlin.
    expect(isBerlinWeekday(new Date("2027-01-17T08:45:00Z"))).toBe(false);
    expect(isBerlinWeekday(new Date("2027-01-17T23:30:00Z"))).toBe(true);
  });

  it("groups distinct online and in-person weekdays in Mon–Sun order across locales", () => {
    const sample = [
      { starts_at: "2027-01-17T08:45:00Z", is_online: false }, // Lord's Day
      { starts_at: "2027-01-15T18:00:00Z", is_online: true }, // Friday
      { starts_at: "2027-01-16T08:30:00Z", is_online: false }, // Saturday
      { starts_at: "2027-01-12T18:00:00Z", is_online: true }, // Tuesday
      { starts_at: "2027-01-19T18:00:00Z", is_online: true }, // Tuesday again
    ];
    expect(sessionFormatDays(sample, "en-GB", "Lord's Day")).toEqual({
      onlineDays: ["Tuesday", "Friday"],
      inPersonDays: ["Saturday", "Lord's Day"],
    });
    expect(sessionFormatDays(sample, "de", "Tag des Herrn")).toEqual({
      onlineDays: ["Dienstag", "Freitag"],
      inPersonDays: ["Samstag", "Tag des Herrn"],
    });
    expect(sessionFormatDays(sample, "ru", "День Господень")).toEqual({
      onlineDays: ["вторник", "пятница"],
      inPersonDays: ["суббота", "День Господень"],
    });
  });

  it("reflects coordinator overrides when a weekday session is toggled in-person", () => {
    const sample = [
      { starts_at: "2027-01-12T18:00:00Z", is_online: true }, // Tuesday
      { starts_at: "2027-01-15T18:00:00Z", is_online: false }, // Friday switched to in-person
      { starts_at: "2027-01-16T08:30:00Z", is_online: false }, // Saturday
    ];
    expect(sessionFormatDays(sample, "en-GB", "Lord's Day")).toEqual({
      onlineDays: ["Tuesday"],
      inPersonDays: ["Friday", "Saturday"],
    });
  });
});
