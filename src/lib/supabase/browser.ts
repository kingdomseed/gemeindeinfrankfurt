"use client";
import { createBrowserClient } from "@supabase/ssr";

// Used by coordinator screens for Realtime updates.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
