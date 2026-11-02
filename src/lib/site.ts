import "server-only";

export type Contact = { name: string; email: string };

// People participants contact with questions, shown in the footer and on the
// privacy page. Each hosting church sets its own, as
// CONTACTS="Name <email>; Name <email>".
export function siteContacts(): Contact[] {
  return (process.env.CONTACTS ?? "")
    .split(";")
    .map((entry) => /^\s*(.+?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>\s*$/.exec(entry))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ name: m[1], email: m[2] }));
}
