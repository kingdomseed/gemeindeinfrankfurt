import type { CollectionConfig } from "payload";

// Editors who sign in to /admin. Training coordinators sign in with Supabase
// Auth instead; the two are separate. An editor can turn on an API key, which
// the weekly import of events from the announcement email uses.
export const Users: CollectionConfig = {
  slug: "users",
  admin: { useAsTitle: "email" },
  auth: { useAPIKey: true },
  fields: [],
};
