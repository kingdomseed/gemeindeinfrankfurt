import { hymnNumber, type Hymn, type Verse } from "@/lib/domain/messages";
import { languages, type Language } from "@/lib/domain/types";

import type { Slide, SlideSection } from "./SlideShow";

// The training rules as the registration form words them, word for word.
export const screenRuleKeys = [
  "attendRules.seat",
  "attendRules.nameTag",
  "attendRules.absences",
  "attendRules.testing",
  "attendRules.leaving",
  "materialsRule",
  "copiesRule",
] as const;

export type ScreenRuleKey = (typeof screenRuleKeys)[number];

export type ScreenSlideLabels = {
  rulesSection: string;
  hymnsSection: string;
  versesSection: string;
  ruleMeta: (index: number, total: number) => string;
  hymnMeta: (index: number, total: number) => string;
  verseMeta: (index: number, total: number) => string;
  ruleText: (key: ScreenRuleKey) => string;
  hymnTitle: (number: string) => string;
  hymnInTitle: (number: string, languageName: string) => string;
  notIn: (languageName: string) => string;
  verseMissing: (languageName: string) => string;
  languageNames: Readonly<Record<Language, string>>;
};

// Builds all slides for one message (rules in `locale`, hymns in `locale` with
// the other languages listed below, and trilingual verses showing all three
// languages side by side on every verse slide).
export function buildMessageSlides(input: {
  locale: Language;
  hymns: readonly Hymn[];
  verses: readonly Verse[];
  labels: ScreenSlideLabels;
}): { slides: Slide[]; sections: SlideSection[] } {
  const { locale, hymns: rawHymns, verses: rawVerses, labels } = input;

  const rules: Slide[] = screenRuleKeys.map((key, i) => ({
    meta: labels.ruleMeta(i + 1, screenRuleKeys.length),
    title: labels.ruleText(key),
    body: "",
    lang: locale,
  }));

  const hymns: Slide[] = rawHymns.map((h, i) => {
    const own = hymnNumber(h, locale);
    return {
      meta: labels.hymnMeta(i + 1, rawHymns.length),
      title: own ? labels.hymnTitle(own) : labels.hymnInTitle(h.en, labels.languageNames.en),
      body: languages
        .filter((l) => l !== locale && (own || l !== "en"))
        .map(
          (l) =>
            `${labels.languageNames[l]} ${hymnNumber(h, l) ?? labels.notIn(labels.languageNames[l])}`,
        )
        .join("\n"),
      lang: locale,
    };
  });

  const verses: Slide[] = rawVerses.map((v, i) => ({
    meta: labels.verseMeta(i + 1, rawVerses.length),
    title: v.ref,
    body: "",
    lang: locale,
    columns: languages.map((l) => {
      const text = v.text[l]?.trim() ?? "";
      return {
        lang: l,
        label: labels.languageNames[l],
        text: text || labels.verseMissing(labels.languageNames[l]),
        missing: text.length === 0,
      };
    }),
  }));

  const sections: SlideSection[] = [
    { label: labels.rulesSection, startIndex: 0 },
    ...(hymns.length > 0 ? [{ label: labels.hymnsSection, startIndex: rules.length }] : []),
    ...(verses.length > 0
      ? [{ label: labels.versesSection, startIndex: rules.length + hymns.length }]
      : []),
  ];

  return { slides: [...rules, ...hymns, ...verses], sections };
}
