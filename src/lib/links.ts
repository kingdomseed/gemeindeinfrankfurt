import "server-only";
import { z } from "zod";

import { spaceSections, type SectionKey } from "@/lib/domain/links";
import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

const section = z.enum(spaceSections);

export type SpaceLink = {
  id: string;
  section: SectionKey;
  title: string;
  url: string;
  addedBy: string;
  createdAt: string;
};

// Shared external links (Google Docs, Sheets, Slides, URLs) attached to the
// training's coordinator spaces. Coordinators see and edit them live together.
export async function loadTrainingLinks(
  supabase: CoordinatorClient,
  trainingId: string,
): Promise<SpaceLink[]> {
  const { data, error } = await supabase
    .from("training_links")
    .select("id, section, title, url, added_by, created_at")
    .eq("training_id", trainingId)
    .order("created_at");
  if (error) throw error;
  return data.flatMap((row) => {
    const parsedSection = section.safeParse(row.section);
    if (!parsedSection.success) return [];
    return [
      {
        id: row.id,
        section: parsedSection.data,
        title: row.title,
        url: row.url,
        addedBy: row.added_by,
        createdAt: row.created_at,
      },
    ];
  });
}

export async function addTrainingLink(
  supabase: CoordinatorClient,
  trainingId: string,
  input: { section: SectionKey; title: string; url: string },
) {
  const { data: auth } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("coordinators")
    .select("display_name")
    .eq("user_id", auth.user?.id ?? "")
    .maybeSingle();
  const { error } = await supabase.from("training_links").insert({
    training_id: trainingId,
    section: input.section,
    title: input.title,
    url: input.url,
    added_by: me?.display_name ?? "",
  });
  if (error) throw error;
}

export async function removeTrainingLink(supabase: CoordinatorClient, id: string) {
  const { error } = await supabase.from("training_links").delete().eq("id", id);
  if (error) throw error;
}
