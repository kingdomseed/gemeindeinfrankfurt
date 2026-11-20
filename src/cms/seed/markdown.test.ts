import { describe, expect, it } from "vitest";

import { parsePageFile, toEditorMarkdown, toSeedBlocks } from "./markdown";

const mapUrl = (address: string) => `https://map.example/?q=${address}`;

const file = `---
title: "Für Besucher – die Gemeinde in Frankfurt"
source: https://web.archive.org/example
---

# Für Besucher

Wir heissen Sie herzlich willkommen.

---

Zweiter Absatz.

<!-- Sidebar -->
### Kontaktieren Sie Uns

Senden Sie uns eine E-Mail.

<!-- Footer -->
Copyright 2022 die Gemeinde in Frankfurt
`;

describe("parsePageFile", () => {
  it("splits title, body and contact panel, and drops front matter and footer", () => {
    expect(parsePageFile(file)).toEqual({
      title: "Für Besucher",
      body: "Wir heissen Sie herzlich willkommen.\n\n---\n\nZweiter Absatz.",
      contact: { heading: "Kontaktieren Sie Uns", intro: "Senden Sie uns eine E-Mail." },
    });
  });

  it("has no contact panel when the file has no sidebar", () => {
    expect(parsePageFile("# Titel\n\nText.\n").contact).toBeNull();
  });

  it("rejects a file without a title", () => {
    expect(() => parsePageFile("Text.\n")).toThrow("Page file has no '# ' title");
  });
});

describe("toEditorMarkdown", () => {
  it("replaces the Google Maps embed with a link to the address", () => {
    const body =
      "**Unserer Versammlungsort:**\n\n[Karte / Map: Ginnheimer Stadtweg 120, 60431 Frankfurt am Main](https://www.google.com/maps/embed?pb=!1m18!2sGinnheimer)";
    expect(toEditorMarkdown(body, mapUrl)).toBe(
      "**Unserer Versammlungsort:**\n\n[Ginnheimer Stadtweg 120, 60431 Frankfurt am Main](https://map.example/?q=Ginnheimer Stadtweg 120, 60431 Frankfurt am Main)",
    );
  });

  it("drops link titles and keeps the link", () => {
    expect(
      toEditorMarkdown(
        '*[Bibeln für Europa](http://www.biblesforeurope.org/ "Bibeln für Europa")*.',
        mapUrl,
      ),
    ).toBe("*[Bibeln für Europa](http://www.biblesforeurope.org/)*.");
  });

  it("writes bold italic questions as **_text_**", () => {
    expect(toEditorMarkdown("***Wer ist Ihr Pfarrer?***  \nGottes Absicht", mapUrl)).toBe(
      "**_Wer ist Ihr Pfarrer?_**  \nGottes Absicht",
    );
  });

  it("puts a line break after a bold label that runs into its text", () => {
    expect(toEditorMarkdown("**DIE BIBEL**Die Bibel ist.  \n(2 Petr. 1:21)", mapUrl)).toBe(
      "**DIE BIBEL**  \nDie Bibel ist.  \n(2 Petr. 1:21)",
    );
  });

  it("leaves a bold line on its own unchanged", () => {
    expect(toEditorMarkdown("**Our meeting place:**\n\nText", mapUrl)).toBe(
      "**Our meeting place:**\n\nText",
    );
  });
});

describe("toSeedBlocks", () => {
  it("keeps plain text as one text section per part", () => {
    expect(toSeedBlocks("First.\n\n---\n\nSecond.")).toEqual([
      { blockType: "text", markdown: "First." },
      { blockType: "text", markdown: "Second." },
    ]);
  });

  it("turns the part with the map link into the meeting place", () => {
    const body =
      "**Our meeting place:**\n\n[Karte / Map: Example Street 1](https://www.google.com/maps/embed?pb=1)";
    expect(toSeedBlocks(body)).toEqual([
      { blockType: "meetingPlace", heading: "Our meeting place:" },
    ]);
  });

  it("splits questions and answers, in either emphasis style", () => {
    const body = "Intro.\n\n---\n\n***First?***  \nYes.\n\nMore.\n\n_**Second?**_  \nNo.";
    expect(toSeedBlocks(body)).toEqual([
      { blockType: "text", markdown: "Intro." },
      {
        blockType: "faq",
        items: [
          { question: "First?", answer: "Yes.\n\nMore." },
          { question: "Second?", answer: "No." },
        ],
      },
    ]);
  });

  it("splits statements from their references and keeps text before them", () => {
    const body = "#### Lead\n\n**THE BIBLE**The Bible is complete.  \n(2 Pet. 1:21)";
    expect(toSeedBlocks(body)).toEqual([
      { blockType: "text", markdown: "#### Lead" },
      {
        blockType: "statements",
        items: [
          { heading: "THE BIBLE", text: "The Bible is complete.", references: "(2 Pet. 1:21)" },
        ],
      },
    ]);
  });
});
