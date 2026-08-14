import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

export type VisibleComment = {
  id: string;
  body: string;
  created_at: string | null;
  parent_id: string | null;
  author: {
    display_name: string | null;
    github_username: string | null;
  } | null;
};

type CommentRow = {
  id: string;
  body: string;
  created_at: string | null;
  parent_id: string | null;
  profiles:
    | {
        display_name: string | null;
        github_username: string | null;
      }
    | {
        display_name: string | null;
        github_username: string | null;
      }[]
    | null;
};

function mapAuthor(profiles: CommentRow["profiles"]): VisibleComment["author"] {
  if (!profiles) {
    return null;
  }

  const row = Array.isArray(profiles) ? profiles[0] : profiles;
  if (!row) {
    return null;
  }

  return {
    display_name: row.display_name,
    github_username: row.github_username,
  };
}

export async function getVisibleComments(
  postId: string,
): Promise<VisibleComment[]> {
  "use cache";
  cacheTag("comments", `comments:${postId}`);
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, body, created_at, parent_id, profiles!comments_author_id_fkey (display_name, github_username)",
      )
      .eq("post_id", postId)
      .eq("status", "visible")
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return (data as CommentRow[]).map((row) => ({
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      parent_id: row.parent_id,
      author: mapAuthor(row.profiles),
    }));
  } catch {
    return [];
  }
}
