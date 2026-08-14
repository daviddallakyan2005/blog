"use server";

import { updateTag } from "next/cache";

import { requireOwner } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { firstZodError, slugSchema } from "@/lib/validations/posts.schema";
import {
  createProjectSchema,
  projectIdSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validations/projects.schema";

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

function bustProjectCache(slug?: string) {
  updateTag("projects");
  if (slug) {
    updateTag(`project:${slug}`);
  }
}

async function slugTaken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase.from("projects").select("id").eq("slug", slug);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }
  const { data } = await query.maybeSingle();
  return data != null;
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
): Promise<string> {
  const base = slugify(name) || "project";
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

export async function createProject(
  input: CreateProjectInput,
): Promise<ActionResult<{ id: string }>> {
  await requireOwner();

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, parsed.data.name);

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: parsed.data.name,
      slug,
    })
    .select("id")
    .single();

  if (error || !data) {
    return fail(error?.message ?? "Could not create project");
  }

  bustProjectCache(slug);
  return { success: true, id: data.id };
}

export async function updateProject(
  input: UpdateProjectInput,
): Promise<ActionResult> {
  await requireOwner();

  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  if (!slugSchema.safeParse(parsed.data.slug).success) {
    return fail("Slug must be lowercase kebab-case");
  }

  const supabase = await createClient();

  if (await slugTaken(supabase, parsed.data.slug, parsed.data.id)) {
    return fail("That slug is already in use");
  }

  const { data: existing, error: loadError } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !existing) {
    return fail(loadError?.message ?? "Project not found");
  }

  const rendered = await renderMarkdown(parsed.data.description_md);

  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      tagline: emptyToNull(parsed.data.tagline),
      description_md: parsed.data.description_md,
      description_html: rendered.html,
      repo_url: emptyToNull(parsed.data.repo_url),
      homepage_url: emptyToNull(parsed.data.homepage_url),
      primary_language: emptyToNull(parsed.data.primary_language),
      tech: parsed.data.tech,
      role: emptyToNull(parsed.data.role),
      status: parsed.data.status,
      featured: parsed.data.featured,
      sort_order: parsed.data.sort_order,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  bustProjectCache(existing.slug);
  if (existing.slug !== parsed.data.slug) {
    bustProjectCache(parsed.data.slug);
  }

  return { success: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireOwner();

  const parsed = projectIdSchema.safeParse({ id });
  if (!parsed.success) {
    return fail(firstZodError(parsed.error));
  }

  const supabase = await createClient();
  const { data: project, error: loadError } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError || !project) {
    return fail(loadError?.message ?? "Project not found");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return fail(error.message);
  }

  bustProjectCache(project.slug);
  return { success: true };
}
