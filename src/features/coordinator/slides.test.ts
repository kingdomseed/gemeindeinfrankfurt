import { describe, expect, it } from "vitest";

import { buildMessageSlides, screenRuleKeys, type ScreenSlideLabels } from "./slides";

const labels: ScreenSlideLabels = {
  rulesSection: "Rules",
  hymnsSection: "Hymns",
  versesSection: "Verses",
  ruleMeta: (i, total) => `Rule ${i}/${total}`,
  hymnMeta: (i, total) => `Hymn ${i}/${total}`,
  verseMeta: (i, total) => `Verse ${i}/${total}`,
  ruleText: (key) => `text:${key}`,
  hymnTitle: (n) => `Hymn ${n}`,
  hymnInTitle: (n, lang) => `Hymn ${n} (${lang})`,
  notIn: (lang) => `Not in ${lang}`,
  verseMissing: (lang) => `Missing in ${lang}`,
  languageNames: { de: "Deutsch", en: "English", ru: "Русский" },
};

describe("buildMessageSlides", () => {
  it("puts all three languages on every verse slide and preserves missing placeholders", () => {
    const { slides, sections } = buildMessageSlides({
      locale: "en",
      hymns: [{ en: "501", de: "214", ru: null }],
      verses: [{ ref: "John 1:14", text: { de: "Wort", en: "Word" } }],
      labels,
    });

    expect(sections).toEqual([
      { label: "Rules", startIndex: 0 },
      { label: "Hymns", startIndex: screenRuleKeys.length },
      { label: "Verses", startIndex: screenRuleKeys.length + 1 },
    ]);

    const verseSlide = slides.at(-1);
    expect(verseSlide?.title).toBe("John 1:14");
    expect(verseSlide?.columns).toEqual([
      { lang: "de", label: "Deutsch", text: "Wort", missing: false },
      { lang: "en", label: "English", text: "Word", missing: false },
      { lang: "ru", label: "Русский", text: "Missing in Русский", missing: true },
    ]);
  });

  it("omits empty Hymns/Verses sections from quick jump", () => {
    const { slides, sections } = buildMessageSlides({
      locale: "de",
      hymns: [],
      verses: [{ ref: "Col. 1:27", text: { de: "A", en: "B", ru: "C" } }],
      labels,
    });

    expect(sections).toEqual([
      { label: "Rules", startIndex: 0 },
      { label: "Verses", startIndex: screenRuleKeys.length },
    ]);
    expect(slides).toHaveLength(screenRuleKeys.length + 1);
  });
});
