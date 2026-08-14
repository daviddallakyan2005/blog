"use server";

import { updateTag } from "next/cache";

import { requireOwner } from "@/lib/auth";
import type { Json } from "@/lib/database.types";
import { renderMarkdown } from "@/lib/markdown";
import { createClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/validations/posts.schema";
import {
  updateSettingsSchema,
  type UpdateSettingsInput,
} from "@/lib/validations/settings.schema";

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

export async function updateSettings(
  input: UpdateSettingsInput,
): Promise<ActionResult> {
  await requireOwner();

  const parsed = updateSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const rendered = await renderMarkdown(parsed.data.bio_md);
  const supabase = await createClient();

  const social = {
    github: emptyToNull(parsed.data.social.github) ?? undefined,
    twitter: emptyToNull(parsed.data.social.twitter) ?? undefined,
    linkedin: emptyToNull(parsed.data.social.linkedin) ?? undefined,
    email: emptyToNull(parsed.data.social.email) ?? undefined,
  };

  const { error } = await supabase
    .from("site_settings")
    .update({
      display_name: emptyToNull(parsed.data.display_name),
      tagline: emptyToNull(parsed.data.tagline),
      bio_md: parsed.data.bio_md,
      bio_html: rendered.html,
      social: social as Json,
      seo_title: emptyToNull(parsed.data.seo_title),
      seo_description: emptyToNull(parsed.data.seo_description),
    })
    .eq("id", 1);

  if (error) {
    return fail(error.message);
  }

  updateTag("settings");
  return { success: true };
}
