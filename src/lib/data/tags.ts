import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

import { compactPosts, type PostListRow } from "./map";
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

const TAG_FILTERED_POST_COLUMNS = `
  id, slug, title, summary, cover_path, published_at, reading_minutes,
  post_tags (
    tags (id, name, slug)
  ),
  filter_tags:post_tags!inner (
    tags!inner (slug)
  )
` as const;

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
    const { data, error } = await supabase
      .from("posts")
      .select(TAG_FILTERED_POST_COLUMNS)
      .eq("status", "published")
      .eq("filter_tags.tags.slug", tagSlug)
      .order("published_at", { ascending: false });

    if (error) {
      return [];
    }

    return compactPosts(data as PostListRow[] | null);
  } catch {
    return [];
  }
}
