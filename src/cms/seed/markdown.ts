// Turns the page files in archive/wordpress-2022/content (and the Russian
// translations next to this file) into what the seed stores in Payload.

export type PageFile = {
  title: string;
  body: string;
  contact: { heading: string; intro: string } | null;
};

const frontMatter = /^---\n[\s\S]*?\n---\n/;
const pageTitle = /^# (.+)$/m;
const sidebarHeading = /^### (.+)$/m;

// The front matter and the "<!-- Footer -->" block are dropped. The first
// "# " heading is the page title, and the "<!-- Sidebar -->" block is the
// contact panel's heading and text.
export function parsePageFile(markdown: string): PageFile {
  const [beforeFooter = ""] = markdown.replace(frontMatter, "").split("<!-- Footer -->");
  const [main = "", sidebar = ""] = beforeFooter.split("<!-- Sidebar -->");
  const title = pageTitle.exec(main);
  if (!title?.[1]) throw new Error("Page file has no '# ' title");
  return {
    title: title[1].trim(),
    body: main.slice(title.index + title[0].length).trim(),
    contact: parseSidebar(sidebar),
  };
}

function parseSidebar(sidebar: string): PageFile["contact"] {
  const heading = sidebarHeading.exec(sidebar);
  if (!heading?.[1]) return null;
  return {
    heading: heading[1].trim(),
    intro: sidebar.slice(heading.index + heading[0].length).trim(),
  };
}

const googleMapLink = /^\[Karte \/ Map: (.+)\]\(https:\/\/www\.google\.com\/maps\/[^)\s]*\)$/m;
const linkTitle = /\]\((\S+) "[^"]*"\)/g;
const boldItalic = /\*\*\*([^*\n]+)\*\*\*/g;
const runInLabel = /^(\*\*[^*\n]+\*\*)(?=\S)/gm;

// Rewrites the recovered Markdown so Payload's Markdown import keeps every
// word and its emphasis:
// - the Google Maps embed becomes a plain link to the address on OpenStreetMap;
// - link titles are dropped (the importer would read them as part of the URL);
// - ***text*** becomes **_text_** (the importer mis-reads triple asterisks);
// - "**DIE BIBEL**Die Bibel …" gets back the line break the old page had
//   after the bold label.
export function toEditorMarkdown(body: string, mapUrl: (address: string) => string): string {
  return body
    .replace(googleMapLink, (_match: string, address: string) => `[${address}](${mapUrl(address)})`)
    .replace(linkTitle, "]($1)")
    .replace(boldItalic, "**_$1_**")
    .replace(runInLabel, "$1  \n");
}
