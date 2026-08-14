import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

export type SearchResult = {
  slug: string;
  kind: string;
  title: string;
  snippet: string;
  rank: number;
};

export async function searchPosts(
  q: string,
  limit = 20,
): Promise<SearchResult[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");

  const query = q.trim();
  if (!query) {
    return [];
  }

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc("search_posts", {
      q: query,
      limit_n: limit,
    });

    if (error || !data) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
}
