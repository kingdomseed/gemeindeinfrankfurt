import { describe, expect, it } from "vitest";

import {
  groupCount,
  groupSizeOk,
  isSeparateGroupSite,
  pickStudyGroup,
  smallestGroup,
  suggestGroups,
  type GroupPerson,
} from "./groups";

const people = (
  count: number,
  language: GroupPerson["language"],
  locality: string | null,
  prefix: string,
  extra: Pick<GroupPerson, "siteId" | "siteName"> = {},
): GroupPerson[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    language,
    locality,
    ...extra,
  }));

describe("groupCount", () => {
  it("makes groups of 8 to 10 when the numbers allow it", () => {
    expect(groupCount(0)).toBe(0);
    expect(groupCount(9)).toBe(1);
    expect(groupCount(15)).toBe(2);
    expect(groupCount(20)).toBe(2);
    expect(groupCount(27)).toBe(3);
    expect(groupCount(38)).toBe(4);
  });

  it("keeps a small language together rather than splitting it", () => {
    expect(groupCount(3)).toBe(1);
    expect(groupCount(12)).toBe(1);
  });
});

describe("isSeparateGroupSite", () => {
  it("detects Mannheim and Heidelberg attendance sites", () => {
    expect(isSeparateGroupSite("Mannheim/Heidelberg")).toBe(true);
    expect(isSeparateGroupSite("Heidelberg")).toBe(true);
    expect(isSeparateGroupSite("Frankfurt am Main")).toBe(false);
    expect(isSeparateGroupSite(null)).toBe(false);
  });
});

describe("suggestGroups", () => {
  it("groups by language first, in German, English, Russian order", () => {
    const groups = suggestGroups([
      ...people(3, "ru", "Frankfurt", "r"),
      ...people(9, "de", "Frankfurt", "d"),
      ...people(4, "en", "Mainz", "e"),
    ]);
    expect(groups.map((g) => [g.language, g.memberIds.length, g.siteId])).toEqual([
      ["de", 9, null],
      ["en", 4, null],
      ["ru", 3, null],
    ]);
  });

  it("keeps a city together, the largest city first, and splits evenly", () => {
    const groups = suggestGroups([
      ...people(4, "de", "Darmstadt", "dar"),
      ...people(12, "de", "Frankfurt", "ffm"),
      ...people(2, "de", null, "x"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.memberIds.length)).toEqual([9, 9]);
    expect(groups[0]?.memberIds.every((id) => id.startsWith("ffm"))).toBe(true);
    expect(groups[1]?.memberIds.slice(0, 3)).toEqual(["ffm10", "ffm11", "ffm12"]);
    expect(groups[1]?.memberIds.slice(3, 7)).toEqual(["dar1", "dar2", "dar3", "dar4"]);
  });

  it("leaves out a language nobody chose", () => {
    expect(suggestGroups(people(8, "en", "Frankfurt", "e")).map((g) => g.language)).toEqual(["en"]);
  });

  it("keeps Mannheim/Heidelberg in its own group and defaults ties to English", () => {
    const mhSite = { siteId: "site-mh", siteName: "Mannheim/Heidelberg" };
    const ffmSite = { siteId: "site-ffm", siteName: "Frankfurt am Main" };
    const groups = suggestGroups([
      ...people(2, "en", "Frankfurt am Main", "ffm", ffmSite),
      ...people(1, "de", "Heidelberg", "mh-de", mhSite),
      ...people(1, "en", "Mannheim", "mh-en", mhSite),
    ]);
    expect(groups).toEqual([
      { language: "en", memberIds: ["ffm1", "ffm2"], siteId: null },
      { language: "en", memberIds: ["mh-de1", "mh-en1"], siteId: "site-mh" },
    ]);
  });

  it("uses another language for Mannheim/Heidelberg only when it is the clear majority", () => {
    const mhSite = { siteId: "site-mh", siteName: "Mannheim/Heidelberg" };
    const groups = suggestGroups([
      ...people(2, "de", "Mannheim", "mh-de", mhSite),
      ...people(1, "en", "Heidelberg", "mh-en", mhSite),
    ]);
    expect(groups).toEqual([
      { language: "de", memberIds: ["mh-de1", "mh-de2", "mh-en1"], siteId: "site-mh" },
    ]);
  });
});

describe("smallestGroup", () => {
  const groups = [
    { id: "g1", language: "de" as const, size: 10 },
    { id: "g2", language: "de" as const, size: 8 },
    { id: "g3", language: "en" as const, size: 5 },
    { id: "g4", language: "de" as const, size: 8 },
  ];

  it("picks the smallest group in the person's language, the first of equals", () => {
    expect(smallestGroup(groups, "de")?.id).toBe("g2");
    expect(smallestGroup(groups, "en")?.id).toBe("g3");
    expect(smallestGroup(groups, "ru")).toBeNull();
  });
});

describe("pickStudyGroup", () => {
  const groups = [
    { id: "g-ffm-en", language: "en" as const, siteId: null, size: 1 },
    { id: "g-mh", language: "en" as const, siteId: "site-mh", size: 4 },
  ];

  it("routes separate-site registrants strictly to their site group even when language differs", () => {
    expect(
      pickStudyGroup(groups, {
        language: "de",
        siteId: "site-mh",
        siteName: "Mannheim/Heidelberg",
      }),
    ).toEqual({ group: groups[1], createSiteId: "site-mh" });
  });

  it("never places main-venue registrants into a site-pinned group", () => {
    expect(
      pickStudyGroup([{ id: "g-mh", language: "en" as const, siteId: "site-mh", size: 1 }], {
        language: "en",
        siteId: "site-ffm",
        siteName: "Frankfurt am Main",
      }),
    ).toEqual({ group: null, createSiteId: null });
  });
});

describe("groupSizeOk", () => {
  it("accepts 8 to 10", () => {
    expect([7, 8, 10, 11].map(groupSizeOk)).toEqual([false, true, true, false]);
  });
});
