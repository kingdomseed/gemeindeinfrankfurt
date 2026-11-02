import "server-only";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

// Bypasses row-level security. Only for the public registration flow, where the
// server has already checked the registrant's edit token.
export function createAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
