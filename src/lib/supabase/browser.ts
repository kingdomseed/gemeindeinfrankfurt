"use client";
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Used by coordinator screens for Realtime updates.
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
