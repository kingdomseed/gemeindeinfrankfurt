import "server-only";
import { z } from "zod";

import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

export const serviceKinds = [
  "tech",
  "rules",
  "hymns",
  "verses",
  "questions",
  "attendance",
  "payments",
  "name_tags",
  "groups",
] as const;
export type ServiceKind = (typeof serviceKinds)[number];

const kind = z.enum(serviceKinds).nullable();

export type Service = {
  id: string;
  // Null for a service a coordinator added; its name is then `name`.
  kind: ServiceKind | null;
  name: string;
  lead: string;
};

export type WebcastLogin = {
  website: string;
  userName: string;
  changedBy: string;
  changedAt: string;
};

// The services page: the services in order, the coordinators (who serves in
// AV, and whether the signed-in one does), and the webcast login without its
// password, which only AV coordinators can read at all.
export async function loadServices(supabase: CoordinatorClient, trainingId: string) {
  const [services, coordinators, me, login] = await Promise.all([
    supabase
      .from("services")
      .select("id, kind, name, lead")
      .eq("training_id", trainingId)
      .order("sort_order")
      .order("name"),
    supabase.from("coordinators").select("user_id, display_name, serves_av").order("display_name"),
    supabase.auth.getUser(),
    supabase
      .from("webcast_logins")
      .select("website, user_name, changed_by, changed_at")
      .eq("training_id", trainingId)
      .maybeSingle(),
  ]);
  if (services.error) throw services.error;
  if (coordinators.error) throw coordinators.error;
  if (login.error) throw login.error;
  const myId = me.data.user?.id;
  return {
    services: services.data.map((s): Service => ({
      id: s.id,
      kind: kind.parse(s.kind),
      name: s.name,
      lead: s.lead,
    })),
    coordinatorNames: coordinators.data.map((c) => c.display_name),
    avNames: coordinators.data.filter((c) => c.serves_av).map((c) => c.display_name),
    servesAv: coordinators.data.some((c) => c.user_id === myId && c.serves_av),
    login: login.data
      ? {
          website: login.data.website,
          userName: login.data.user_name,
          changedBy: login.data.changed_by,
          changedAt: login.data.changed_at,
        }
      : null,
  };
}

export type ServicesPage = Awaited<ReturnType<typeof loadServices>>;

async function myName(supabase: CoordinatorClient) {
  const { data: auth } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("coordinators")
    .select("display_name")
    .eq("user_id", auth.user?.id ?? "")
    .maybeSingle();
  return data?.display_name ?? "";
}

// Shows the webcast password to an AV coordinator and logs that it was shown.
// Null when the signed-in coordinator does not serve in AV or nothing is stored.
export async function revealWebcastPassword(
  supabase: CoordinatorClient,
  trainingId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("webcast_logins")
    .select("password")
    .eq("training_id", trainingId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const logged = await supabase
    .from("webcast_login_views")
    .insert({ training_id: trainingId, viewer_name: await myName(supabase) });
  if (logged.error) throw logged.error;
  return data.password;
}

// Saves a new webcast login under the signed-in coordinator's name. A blank
// password keeps the one already stored.
export async function saveWebcastLogin(
  supabase: CoordinatorClient,
  trainingId: string,
  login: { website: string; userName: string; password: string },
) {
  const { error } = await supabase.from("webcast_logins").upsert({
    training_id: trainingId,
    website: login.website,
    user_name: login.userName,
    ...(login.password ? { password: login.password } : {}),
    changed_by: await myName(supabase),
    changed_at: new Date().toISOString(),
  });
  if (error) throw error;
}
