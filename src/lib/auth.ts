import "server-only";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

export type CurrentCoordinator = {
  userId: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  servesAv: boolean;
};

// Returns a Supabase client acting as the signed-in coordinator, or null when
// nobody is signed in or the account is not in the coordinators table. Cached
// for one request, so a layout and its page check only once.
export const getCoordinatorClient = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.rpc("is_coordinator");
  return data === true ? supabase : null;
});

// For server actions: they can be called directly by anyone, so each one that
// touches coordinator data starts with this check.
export async function requireAuth() {
  const supabase = await getCoordinatorClient();
  if (!supabase) throw new Error("Not a coordinator");
  return supabase;
}

// The signed-in coordinator's identity, email, and role flags, cached per request.
export const loadCurrentCoordinator = cache(
  async (supabase: CoordinatorClient): Promise<CurrentCoordinator | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("coordinators")
      .select("user_id, display_name, is_admin, serves_av")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      userId: data.user_id,
      displayName: data.display_name,
      email: auth.user.email ?? null,
      isAdmin: data.is_admin,
      servesAv: data.serves_av,
    };
  },
);

// The signed-in coordinator's display name for audit trails, or "" when absent.
export async function currentCoordinatorName(supabase: CoordinatorClient): Promise<string> {
  return (await loadCurrentCoordinator(supabase))?.displayName ?? "";
}
