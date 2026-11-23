// Plain-text helpers for Lexical rich text, used where a page shows a short
// excerpt of another page's text.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function childrenOf(node: unknown): unknown[] {
  if (!isRecord(node) || !Array.isArray(node.children)) return [];
  return node.children;
}

function textOf(node: unknown): string {
  if (isRecord(node) && typeof node.text === "string") return node.text;
  return childrenOf(node).map(textOf).join("");
}

// The text of the first non-empty paragraph, or "" when there is none.
export function firstParagraph(state: unknown): string {
  const root = isRecord(state) ? state.root : undefined;
  for (const node of childrenOf(root)) {
    if (isRecord(node) && node.type === "paragraph") {
      const text = textOf(node).trim();
      if (text) return text;
    }
  }
  return "";
}

// The same state without its first non-empty paragraph, or null when nothing
// but empty paragraphs and rules would be left.
export function withoutFirstParagraph<State>(state: State): State | null {
  if (!isRecord(state) || !isRecord(state.root)) return null;
  const nodes = childrenOf(state.root);
  const index = nodes.findIndex(
    (node) => isRecord(node) && node.type === "paragraph" && textOf(node).trim() !== "",
  );
  const rest = nodes.filter((_, i) => i !== index);
  const hasContent = rest.some(
    (node) => isRecord(node) && node.type !== "horizontalrule" && textOf(node).trim() !== "",
  );
  if (!hasContent) return null;
  return { ...state, root: { ...state.root, children: rest } };
}

// Splits text after its first sentence, so the sentence can stand as a
// heading over the rest. Text with one sentence comes back whole as head.
export function splitFirstSentence(text: string): { head: string; rest: string } {
  const match = /[.!?](?=\s)/.exec(text);
  if (!match) return { head: text.trim(), rest: "" };
  const end = match.index + 1;
  return { head: text.slice(0, end).trim(), rest: text.slice(end).trim() };
}

// A heading stored in capitals ("DIE BIBEL"), as a heading in normal case:
// each word capitalised ("Die Bibel"), or only the first ("Библия").
export function fromCapitals(text: string, eachWord: boolean): string {
  const lower = text.toLocaleLowerCase();
  const pattern = eachWord ? /(^|\s)(\p{L})/gu : /^(\s*)(\p{L})/u;
  return lower.replace(pattern, (_, space: string, letter: string) => space + letter.toUpperCase());
}

function isBold(node: unknown): boolean {
  return isRecord(node) && typeof node.format === "number" && (node.format & 1) === 1;
}

// The bold lead-ins of the paragraphs under the first heading ("**Retreat in
// Gut Elim** 6.–8. March …"), which name the items of an announcement. Text
// before any heading counts too; the scan stops at the second heading.
export function firstSectionHeadlines(state: unknown): string[] {
  const root = isRecord(state) ? state.root : undefined;
  const headlines: string[] = [];
  let headings = 0;
  for (const node of childrenOf(root)) {
    if (!isRecord(node)) continue;
    if (node.type === "heading" && ++headings > 1) break;
    if (node.type !== "paragraph") continue;
    const first = childrenOf(node)[0];
    const text = isBold(first) ? textOf(first).trim() : "";
    if (text) headlines.push(text);
  }
  return headlines;
}
