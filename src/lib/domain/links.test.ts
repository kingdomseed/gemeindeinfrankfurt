import { describe, expect, it } from "vitest";

import { defaultLinkTitle, detectLinkKind, parseExternalLinkUrl } from "./links";

describe("parseExternalLinkUrl", () => {
  it("accepts and normalizes valid https URLs", () => {
    expect(parseExternalLinkUrl("  https://docs.google.com/spreadsheets/d/123/edit  ")).toBe(
      "https://docs.google.com/spreadsheets/d/123/edit",
    );
  });

  it("rejects empty, malformed, non-https, dotless-host, and oversized URLs", () => {
    expect(parseExternalLinkUrl("")).toBeNull();
    expect(parseExternalLinkUrl("not a url")).toBeNull();
    expect(parseExternalLinkUrl("http://docs.google.com/document/d/1")).toBeNull();
    expect(parseExternalLinkUrl("javascript:alert(1)")).toBeNull();
    expect(parseExternalLinkUrl("data:text/html,hi")).toBeNull();
    expect(parseExternalLinkUrl("https://localhost/doc")).toBeNull();
    expect(parseExternalLinkUrl(`https://example.com/${"a".repeat(2000)}`)).toBeNull();
  });
});

describe("detectLinkKind and defaultLinkTitle", () => {
  it("recognizes Google Docs, Sheets, Slides, Drive, and generic links", () => {
    const doc = "https://docs.google.com/document/d/abc/edit";
    const sheet = "https://docs.google.com/spreadsheets/d/abc/edit";
    const slides = "https://docs.google.com/presentation/d/abc/edit";
    const drive = "https://drive.google.com/drive/folders/xyz";
    const other = "https://www.lebensstrom.de/video-training/";

    expect(detectLinkKind(doc)).toBe("google_doc");
    expect(defaultLinkTitle(doc, "google_doc")).toBe("Google Doc");

    expect(detectLinkKind(sheet)).toBe("google_sheet");
    expect(defaultLinkTitle(sheet, "google_sheet")).toBe("Google Sheet");

    expect(detectLinkKind(slides)).toBe("google_slides");
    expect(defaultLinkTitle(slides, "google_slides")).toBe("Google Slides");

    expect(detectLinkKind(drive)).toBe("google_drive");
    expect(defaultLinkTitle(drive, "google_drive")).toBe("Google Drive");

    expect(detectLinkKind(other)).toBe("link");
    expect(defaultLinkTitle(other, "link")).toBe("lebensstrom.de");
  });
});
