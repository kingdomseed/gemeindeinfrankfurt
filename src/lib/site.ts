import "server-only";

export type Contact = { name: string; email: string };

const entryPattern = /^\s*(.+?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>\s*$/;

function parseContacts(value: string | undefined): Contact[] {
  const contacts: Contact[] = [];
  for (const entry of (value ?? "").split(";")) {
    const [, name, email] = entryPattern.exec(entry) ?? [];
    if (name && email) contacts.push({ name, email });
  }
  return contacts;
}

// People participants contact with questions, shown in the footer and on the
// privacy page. Each hosting church sets its own, as
// CONTACTS="Name <email>; Name <email>".
export function siteContacts(): Contact[] {
  return parseContacts(process.env.CONTACTS);
}

// The church in Frankfurt's representative for its imprint. Another church
// running this site sets its own with IMPRINT.
const FRANKFURT_IMPRINT = "Cephas Lin";

// The person the imprint names as representative and responsible for the
// content, as IMPRINT="Name" or IMPRINT="Name <email>". Without an email the
// imprint shows the contact email from the CMS site settings.
export function imprintContact(): { name: string; email: string | null } {
  const value = process.env.IMPRINT?.trim() || FRANKFURT_IMPRINT;
  const [contact] = parseContacts(value);
  return contact ?? { name: value, email: null };
}

// The site's public address, without a trailing slash.
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
