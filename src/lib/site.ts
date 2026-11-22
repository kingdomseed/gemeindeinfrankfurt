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

// The person the imprint names as representative and responsible for the
// content, as IMPRINT="Name <email>". Unset, the imprint names nobody and
// shows the contact email from the CMS site settings.
export function imprintContact(): Contact | null {
  return parseContacts(process.env.IMPRINT)[0] ?? null;
}

// The site's public address, without a trailing slash.
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
