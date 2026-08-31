import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published", "archived"]);

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case");

export const createPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
});

export const autosavePostSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  summary: z.string().max(2000).optional().nullable(),
  body_md: z.string(),
  tagSlugs: z.array(z.string()).max(30).optional(),
  cover_path: z.string().max(2000).optional().nullable(),
  canonical_url: z.string().max(2000).optional().nullable(),
});

export const publishPostSchema = z.object({
  id: z.uuid(),
});

export const setPostTagsSchema = z.object({
  postId: z.uuid(),
  tagSlugs: z.array(z.string()).max(30),
});

export const previewMarkdownSchema = z.object({
  md: z.string(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type AutosavePostInput = z.infer<typeof autosavePostSchema>;
export type PostStatus = z.infer<typeof postStatusSchema>;

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
