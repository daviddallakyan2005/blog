"use server";

import { revalidatePath, updateTag } from "next/cache";

import { requireOwner } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import { createClient } from "@/lib/supabase/server";
import {
  updateCvSchema,
  type UpdateCvInput,
} from "@/lib/validations/cv.schema";
import { firstZodError } from "@/lib/validations/posts.schema";

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

export async function updateCv(input: UpdateCvInput): Promise<ActionResult> {
  await requireOwner();

  const parsed = updateCvSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const rendered = await renderMarkdown(parsed.data.cv_md);
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_settings")
    .update({
      cv_md: parsed.data.cv_md,
      cv_html: rendered.html,
    })
    .eq("id", 1);

  if (error) {
    return fail(error.message);
  }

  updateTag("settings");
  revalidatePath("/cv.pdf");
  return { success: true };
}
