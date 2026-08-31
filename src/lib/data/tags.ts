import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

import type { Tag } from "./types";

export async function getAllTags(): Promise<Tag[]> {
  "use cache";
  cacheTag("posts", "tags");
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, slug, description")
      .order("name");

    if (error || !data) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
}
