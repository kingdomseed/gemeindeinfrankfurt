import "server-only";
import { createClient } from "@/lib/supabase/server";

// Returns a Supabase client acting as the signed-in coordinator, or null when
// nobody is signed in or the account is not in the coordinators table.
export async function getCoordinatorClient() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.rpc("is_coordinator");
  return data === true ? supabase : null;
}

// For server actions: they can be called directly by anyone, so each one that
// touches coordinator data starts with this check.
export async function requireAuth() {
  const supabase = await getCoordinatorClient();
  if (!supabase) throw new Error("Not a coordinator");
  return supabase;
}
