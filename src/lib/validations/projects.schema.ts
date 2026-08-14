import { z } from "zod";

import { slugSchema } from "@/lib/validations/posts.schema";

export const projectStatusSchema = z.enum(["active", "paused", "archived"]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
});

export const updateProjectSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: slugSchema,
  tagline: z.string().max(300).optional().nullable(),
  description_md: z.string(),
  repo_url: z.string().max(2000).optional().nullable(),
  homepage_url: z.string().max(2000).optional().nullable(),
  primary_language: z.string().max(80).optional().nullable(),
  tech: z.array(z.string().trim().min(1).max(60)).max(30),
  role: z.string().max(200).optional().nullable(),
  status: projectStatusSchema,
  featured: z.boolean(),
  sort_order: z.number().int(),
});

export const projectIdSchema = z.object({
  id: z.uuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
