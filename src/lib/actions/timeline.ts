"use server";

import { updateTag } from "next/cache";

import { requireOwner } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import { createClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/validations/posts.schema";
import {
  createTimelineSchema,
  timelineIdSchema,
  updateTimelineSchema,
  type CreateTimelineInput,
  type UpdateTimelineInput,
} from "@/lib/validations/timeline.schema";

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

function optionalDate(value: string | null | undefined): string | null {
  const trimmed = emptyToNull(value);
  if (!trimmed) {
    return null;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

export async function createTimelineEntry(
  input: CreateTimelineInput,
): Promise<ActionResult<{ id: string }>> {
  await requireOwner();

  const parsed = createTimelineSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const rendered = await renderMarkdown(parsed.data.description_md);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("timeline_entries")
    .insert({
      kind: parsed.data.kind,
      title: parsed.data.title,
      org: emptyToNull(parsed.data.org),
      org_url: emptyToNull(parsed.data.org_url),
      start_date: optionalDate(parsed.data.start_date),
      end_date: optionalDate(parsed.data.end_date),
      is_current: parsed.data.is_current,
      description_md: parsed.data.description_md,
      description_html: rendered.html,
      highlights: parsed.data.highlights,
      sort_order: parsed.data.sort_order,
    })
    .select("id")
    .single();

  if (error || !data) {
    return fail(error?.message ?? "Could not create timeline entry");
  }

  updateTag("timeline");
  return { success: true, id: data.id };
}

export async function updateTimelineEntry(
  input: UpdateTimelineInput,
): Promise<ActionResult> {
  await requireOwner();

  const parsed = updateTimelineSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const rendered = await renderMarkdown(parsed.data.description_md);
  const supabase = await createClient();

  const { error } = await supabase
    .from("timeline_entries")
    .update({
      kind: parsed.data.kind,
      title: parsed.data.title,
      org: emptyToNull(parsed.data.org),
      org_url: emptyToNull(parsed.data.org_url),
      start_date: optionalDate(parsed.data.start_date),
      end_date: optionalDate(parsed.data.end_date),
      is_current: parsed.data.is_current,
      description_md: parsed.data.description_md,
      description_html: rendered.html,
      highlights: parsed.data.highlights,
      sort_order: parsed.data.sort_order,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  updateTag("timeline");
  return { success: true };
}

export async function deleteTimelineEntry(id: string): Promise<ActionResult> {
  await requireOwner();

  const parsed = timelineIdSchema.safeParse({ id });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("timeline_entries")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  updateTag("timeline");
  return { success: true };
}
