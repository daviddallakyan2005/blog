import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

import { compactPosts, POST_LIST_COLUMNS, type PostListRow } from "./map";
import type { PublishedPostListItem, Tag } from "./types";

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

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  "use cache";
  cacheTag("tags", `tag:${slug}`);
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, slug, description")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function getPublishedPostsByTag(
  tagSlug: string,
): Promise<PublishedPostListItem[]> {
  "use cache";
  cacheTag("posts", `tag:${tagSlug}`);
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tagSlug)
      .maybeSingle();

    if (tagError || !tag) {
      return [];
    }

    const { data: links, error: linkError } = await supabase
      .from("post_tags")
      .select("post_id")
      .eq("tag_id", tag.id);

    if (linkError || !links?.length) {
      return [];
    }

    const { data: posts, error: postError } = await supabase
      .from("posts")
      .select(POST_LIST_COLUMNS)
      .eq("status", "published")
      .in(
        "id",
        links.map((link) => link.post_id),
      )
      .order("published_at", { ascending: false });

    if (postError) {
      return [];
    }

    return compactPosts(posts as PostListRow[] | null);
  } catch {
    return [];
  }
}
