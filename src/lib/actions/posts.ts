"use server";

import { updateTag } from "next/cache";

import { requireOwner } from "@/lib/auth";
import type { Json } from "@/lib/database.types";
import { renderMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import {
  autosavePostSchema,
  createPostSchema,
  firstZodError,
  previewMarkdownSchema,
  publishPostSchema,
  setPostTagsSchema,
  slugSchema,
  type AutosavePostInput,
  type CreatePostInput,
} from "@/lib/validations/posts.schema";

type ActionOk<T extends object = object> = {
  success: true;
} & T;

type ActionErr = {
  success: false;
  error: string;
};

export type ActionResult<T extends object = object> = ActionOk<T> | ActionErr;

function fail(error: string): ActionErr {
  return { success: false, error };
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function nameFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeTagSlugs(tagSlugs: string[]): string[] {
  return [
    ...new Set(
      tagSlugs
        .map((value) => slugify(value))
        .filter((slug) => slugSchema.safeParse(slug).success),
    ),
  ];
}

function bustPostCache(slug: string) {
  updateTag("posts");
  updateTag(`post:${slug}`);
  updateTag("tags");
}

async function bustIfPublished(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
) {
  const { data } = await supabase
    .from("posts")
    .select("status, slug")
    .eq("id", postId)
    .maybeSingle();

  if (data?.status === "published") {
    bustPostCache(data.slug);
  }
}

async function slugTaken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase.from("posts").select("id").eq("slug", slug);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }
  const { data } = await query.maybeSingle();
  return data != null;
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
): Promise<string> {
  const base = slugify(title) || "post";
  if (!(await slugTaken(supabase, base))) {
    return base;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = crypto.randomUUID().slice(0, 6);
    const slug = `${base.slice(0, 80 - suffix.length - 1)}-${suffix}`;
    if (!(await slugTaken(supabase, slug))) {
      return slug;
    }
  }

  return `${base.slice(0, 43)}-${crypto.randomUUID()}`;
}

export async function createPost(
  input: CreatePostInput,
): Promise<ActionResult<{ id: string }>> {
  await requireOwner();

  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, parsed.data.title);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: parsed.data.title,
      kind: parsed.data.kind,
      slug,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return fail(error?.message ?? "Could not create post");
  }

  return { success: true, id: data.id };
}

export async function setPostTags(
  postId: string,
  tagSlugs: string[],
): Promise<ActionResult> {
  await requireOwner();

  const parsed = setPostTagsSchema.safeParse({ postId, tagSlugs });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const slugs = normalizeTagSlugs(parsed.data.tagSlugs);
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("post_tags")
    .delete()
    .eq("post_id", parsed.data.postId);

  if (deleteError) {
    return fail(deleteError.message);
  }

  if (slugs.length === 0) {
    await bustIfPublished(supabase, parsed.data.postId);
    return { success: true };
  }

  const { data: existing, error: existingError } = await supabase
    .from("tags")
    .select("id, slug")
    .in("slug", slugs);

  if (existingError) {
    return fail(existingError.message);
  }

  const have = new Map((existing ?? []).map((tag) => [tag.slug, tag.id]));
  const missing = slugs.filter((slug) => !have.has(slug));

  if (missing.length > 0) {
    const { data: created, error: createError } = await supabase
      .from("tags")
      .insert(
        missing.map((slug) => ({
          slug,
          name: nameFromSlug(slug),
        })),
      )
      .select("id, slug");

    if (createError) {
      return fail(createError.message);
    }

    for (const tag of created ?? []) {
      have.set(tag.slug, tag.id);
    }
  }

  const rows = slugs
    .map((slug) => have.get(slug))
    .filter((id): id is string => id != null)
    .map((tag_id) => ({ post_id: parsed.data.postId, tag_id }));

  if (rows.length > 0) {
    const { error: joinError } = await supabase.from("post_tags").insert(rows);
    if (joinError) {
      return fail(joinError.message);
    }
  }

  await bustIfPublished(supabase, parsed.data.postId);
  return { success: true };
}

export async function autosavePost(
  input: AutosavePostInput,
): Promise<ActionResult> {
  await requireOwner();

  const parsed = autosavePostSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { id, title, slug, body_md, kind, tagSlugs } = parsed.data;

  const { data: existing, error: loadError } = await supabase
    .from("posts")
    .select("status, slug")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return fail(loadError?.message ?? "Post not found");
  }

  if (await slugTaken(supabase, slug, id)) {
    return fail("That slug is already in use");
  }

  const rendered = await renderMarkdown(body_md);

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      title,
      slug,
      summary: emptyToNull(parsed.data.summary),
      body_md,
      body_html: rendered.html,
      toc_json: rendered.toc as unknown as Json,
      reading_minutes: rendered.readingMinutes,
      word_count: rendered.wordCount,
      kind,
      cover_path: emptyToNull(parsed.data.cover_path),
      canonical_url: emptyToNull(parsed.data.canonical_url),
    })
    .eq("id", id);

  if (updateError) {
    return fail(updateError.message);
  }

  if (existing.status === "published") {
    bustPostCache(existing.slug);
    if (slug !== existing.slug) {
      bustPostCache(slug);
    }
  }

  const { error: revisionError } = await supabase
    .from("post_revisions")
    .insert({
      post_id: id,
      title,
      body_md,
    });

  if (revisionError) {
    return fail(revisionError.message);
  }

  if (tagSlugs) {
    const tagsResult = await setPostTags(id, tagSlugs);
    if (!tagsResult.success) {
      return tagsResult;
    }
  }

  return { success: true };
}

export async function publishPost(id: string): Promise<ActionResult> {
  await requireOwner();

  const parsed = publishPostSchema.safeParse({ id });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { data: post, error: loadError } = await supabase
    .from("posts")
    .select("slug, body_md, published_at")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !post) {
    return fail(loadError?.message ?? "Post not found");
  }

  const rendered = await renderMarkdown(post.body_md);

  const { error } = await supabase
    .from("posts")
    .update({
      status: "published",
      published_at: post.published_at ?? new Date().toISOString(),
      body_html: rendered.html,
      toc_json: rendered.toc as unknown as Json,
      reading_minutes: rendered.readingMinutes,
      word_count: rendered.wordCount,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  bustPostCache(post.slug);
  return { success: true };
}

export async function unpublishPost(id: string): Promise<ActionResult> {
  await requireOwner();

  const parsed = publishPostSchema.safeParse({ id });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { data: post, error: loadError } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !post) {
    return fail(loadError?.message ?? "Post not found");
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "draft" })
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  bustPostCache(post.slug);
  return { success: true };
}

export async function archivePost(id: string): Promise<ActionResult> {
  await requireOwner();

  const parsed = publishPostSchema.safeParse({ id });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { data: post, error: loadError } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !post) {
    return fail(loadError?.message ?? "Post not found");
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "archived" })
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  bustPostCache(post.slug);
  return { success: true };
}

export async function deletePost(id: string): Promise<ActionResult> {
  await requireOwner();

  const parsed = publishPostSchema.safeParse({ id });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { data: post, error: loadError } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !post) {
    return fail(loadError?.message ?? "Post not found");
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  bustPostCache(post.slug);
  return { success: true };
}

export async function previewMarkdown(md: string) {
  await requireOwner();

  const parsed = previewMarkdownSchema.safeParse({ md });
  if (!parsed.success) {
    throw new Error(firstZodError(parsed.error));
  }

  return renderMarkdown(parsed.data.md);
}
