import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

import {
  compactPosts,
  mapDetailPost,
  POST_DETAIL_COLUMNS,
  POST_LIST_COLUMNS,
  type PostDetailRow,
  type PostListRow,
} from "./map";
import type { PublishedPost, PublishedPostListItem } from "./types";

export type {
  PublishedPost,
  PublishedPostListItem,
  Tag,
  TocItem,
} from "./types";
export { getAllTags, getPublishedPostsByTag } from "./tags";

export async function getPublishedArticles(
  limit = 20,
  offset = 0,
): Promise<PublishedPostListItem[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  return getPublishedByKind("article", limit, offset);
}

export async function getPublishedNotes(
  limit = 20,
  offset = 0,
): Promise<PublishedPostListItem[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  return getPublishedByKind("note", limit, offset);
}

export async function countPublishedPosts(
  kind: "article" | "note",
): Promise<number> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("kind", kind);

    if (error) {
      return 0;
    }

    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<PublishedPost | null> {
  "use cache";
  cacheTag("posts", `post:${slug}`);
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_DETAIL_COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapDetailPost(data as PostDetailRow);
  } catch {
    return null;
  }
}

async function getPublishedByKind(
  kind: "article" | "note",
  limit: number,
  offset: number,
): Promise<PublishedPostListItem[]> {
  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_LIST_COLUMNS)
      .eq("status", "published")
      .eq("kind", kind)
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return [];
    }

    return compactPosts(data as PostListRow[] | null);
  } catch {
    return [];
  }
}
