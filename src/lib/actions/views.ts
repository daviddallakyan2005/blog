"use server";

import { createClient } from "@/lib/supabase/server";
import { postIdSchema } from "@/lib/validations/engagement.schema";
import { firstZodError } from "@/lib/validations/posts.schema";

type ActionOk = { success: true };
type ActionErr = { success: false; error: string };
export type ViewActionResult = ActionOk | ActionErr;

function fail(error: string): ActionErr {
  return { success: false, error };
}

export async function recordPostView(
  postId: string,
): Promise<ViewActionResult> {
  const parsed = postIdSchema.safeParse({ postId });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_post_view", {
    post_id: parsed.data.postId,
  });

  if (error) {
    return fail("Could not record view.");
  }

  return { success: true };
}
