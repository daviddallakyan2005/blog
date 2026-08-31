"use server";

import { updateTag } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { postIdSchema } from "@/lib/validations/engagement.schema";
import { firstZodError } from "@/lib/validations/posts.schema";

type ActionOk = { success: true; liked: boolean };
type ActionErr = { success: false; error: string };
export type LikeActionResult = ActionOk | ActionErr;

function fail(error: string): ActionErr {
  return { success: false, error };
}

function bustLikeCache(slug: string) {
  updateTag("posts");
  updateTag(`post:${slug}`);
}

export async function togglePostLike(
  postId: string,
): Promise<LikeActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return fail("Sign in to like.");
  }

  const parsed = postIdSchema.safeParse({ postId });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, slug")
    .eq("id", parsed.data.postId)
    .eq("status", "published")
    .maybeSingle();

  if (!post) {
    return fail("Post not found.");
  }

  const { data: existing, error: lookupError } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", parsed.data.postId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (lookupError) {
    return fail("Could not update like.");
  }

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", parsed.data.postId)
      .eq("profile_id", profile.id);

    if (error) {
      return fail("Could not update like.");
    }

    bustLikeCache(post.slug);
    return { success: true, liked: false };
  }

  const { error } = await supabase.from("post_likes").insert({
    post_id: parsed.data.postId,
    profile_id: profile.id,
  });

  if (error) {
    if (error.code === "23505") {
      bustLikeCache(post.slug);
      return { success: true, liked: true };
    }
    return fail("Could not update like.");
  }

  bustLikeCache(post.slug);
  return { success: true, liked: true };
}
