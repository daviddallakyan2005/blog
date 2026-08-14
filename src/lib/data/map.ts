import type { Json } from "@/lib/database.types";

import type {
  PublishedPost,
  PublishedPostListItem,
  Tag,
  TocItem,
} from "./types";

type TagRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

type PostTagJoin = {
  tags: TagRow | TagRow[] | null;
};

export type PostListRow = {
  id: string;
  slug: string;
  kind: string;
  title: string;
  summary: string | null;
  cover_path: string | null;
  published_at: string | null;
  reading_minutes: number;
  post_tags: PostTagJoin[] | null;
};

export type PostDetailRow = PostListRow & {
  body_html: string;
  toc_json: Json;
  canonical_url: string | null;
};

export const POST_LIST_COLUMNS = `
  id,
  slug,
  kind,
  title,
  summary,
  cover_path,
  published_at,
  reading_minutes,
  post_tags (
    tags (
      id,
      name,
      slug
    )
  )
` as const;

export const POST_DETAIL_COLUMNS = `
  id,
  slug,
  kind,
  title,
  summary,
  cover_path,
  published_at,
  reading_minutes,
  body_html,
  toc_json,
  canonical_url,
  post_tags (
    tags (
      id,
      name,
      slug
    )
  )
` as const;

export function flattenTags(rows: PostTagJoin[] | null): Tag[] {
  if (!rows) {
    return [];
  }

  const tags: Tag[] = [];

  for (const row of rows) {
    const value = row.tags;
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      tags.push(...value.map(toTag));
    } else {
      tags.push(toTag(value));
    }
  }

  return tags;
}

function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
  };
}

export function parseToc(json: Json): TocItem[] {
  if (!Array.isArray(json)) {
    return [];
  }

  return json.filter(isTocItem);
}

function isTocItem(value: unknown): value is TocItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    typeof item.level === "number"
  );
}

export function mapListPost(row: PostListRow): PublishedPostListItem | null {
  if (row.kind !== "article" && row.kind !== "note") {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    cover_path: row.cover_path,
    published_at: row.published_at,
    reading_minutes: row.reading_minutes,
    tags: flattenTags(row.post_tags),
  };
}

export function mapDetailPost(row: PostDetailRow): PublishedPost | null {
  const base = mapListPost(row);
  if (!base) {
    return null;
  }

  return {
    ...base,
    body_html: row.body_html,
    toc_json: parseToc(row.toc_json),
    canonical_url: row.canonical_url,
  };
}

export function compactPosts(
  rows: PostListRow[] | null,
): PublishedPostListItem[] {
  return (rows ?? []).flatMap((row) => {
    const post = mapListPost(row);
    return post ? [post] : [];
  });
}
