import { z } from "zod";

export const commentStatusSchema = z.enum([
  "visible",
  "pending",
  "hidden",
  "spam",
]);

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be 2000 characters or fewer"),
  postId: z.uuid(),
  parentId: z.uuid().optional().nullable(),
});

export const moderateCommentSchema = z.object({
  id: z.uuid(),
  status: commentStatusSchema,
});

export const commentIdSchema = z.object({
  id: z.uuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CommentStatus = z.infer<typeof commentStatusSchema>;
