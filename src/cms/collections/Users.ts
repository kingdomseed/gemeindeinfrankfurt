import type { CollectionConfig } from "payload";

// Editors who sign in to /admin. Training coordinators sign in with Supabase
// Auth instead; the two are separate.
export const Users: CollectionConfig = {
  slug: "users",
  admin: { useAsTitle: "email" },
  auth: true,
  fields: [],
};
