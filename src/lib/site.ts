import "server-only";

export type Contact = { name: string; email: string };

const entryPattern = /^\s*(.+?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>\s*$/;

// People participants contact with questions, shown in the footer and on the
// privacy page. Each hosting church sets its own, as
// CONTACTS="Name <email>; Name <email>".
export function siteContacts(): Contact[] {
  const contacts: Contact[] = [];
  for (const entry of (process.env.CONTACTS ?? "").split(";")) {
    const [, name, email] = entryPattern.exec(entry) ?? [];
    if (name && email) contacts.push({ name, email });
  }
  return contacts;
}
