"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getCurrentProfile, requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  commentIdSchema,
  createCommentSchema,
  moderateCommentSchema,
  type CommentStatus,
  type CreateCommentInput,
} from "@/lib/validations/comments.schema";
import { firstZodError } from "@/lib/validations/posts.schema";

type ActionOk = { success: true };
type ActionErr = { success: false; error: string };
export type CommentActionResult = ActionOk | ActionErr;

function fail(error: string): ActionErr {
  return { success: false, error };
}

async function bustCommentCache(postId: string) {
  updateTag("comments");
  updateTag(`comments:${postId}`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", postId)
    .maybeSingle();

  if (data?.slug) {
    updateTag(`post:${data.slug}`);
  }

  revalidatePath("/studio/comments");
}

export async function createComment(
  input: CreateCommentInput,
): Promise<CommentActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return fail("Sign in to comment.");
  }

  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const { body, postId, parentId } = parsed.data;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("status", "published")
    .maybeSingle();

  if (!post) {
    return fail("Post not found.");
  }

  if (parentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("id, post_id, parent_id")
      .eq("id", parentId)
      .maybeSingle();

    if (!parent || parent.post_id !== postId) {
      return fail("Parent comment not found.");
    }

    if (parent.parent_id) {
      return fail("Replies can only be nested one level.");
    }
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: profile.id,
    parent_id: parentId ?? null,
    body,
    status: "pending",
  });

  if (error) {
    if (error.message.toLowerCase().includes("comment rate limit")) {
      return fail("Too many comments. Try again in an hour.");
    }
    return fail(error.message);
  }

  return { success: true };
}

export async function moderateComment(
  id: string,
  status: CommentStatus,
): Promise<CommentActionResult> {
  await requireOwner();

  const parsed = moderateCommentSchema.safeParse({ id, status });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { data: comment } = await supabase
    .from("comments")
    .select("post_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!comment) {
    return fail("Comment not found.");
  }

  const { error } = await supabase
    .from("comments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  await bustCommentCache(comment.post_id);
  return { success: true };
}

export async function deleteComment(id: string): Promise<CommentActionResult> {
  await requireOwner();

  const parsed = commentIdSchema.safeParse({ id });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { data: comment } = await supabase
    .from("comments")
    .select("post_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!comment) {
    return fail("Comment not found.");
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  await bustCommentCache(comment.post_id);
  return { success: true };
}
