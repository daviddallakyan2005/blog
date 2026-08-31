import { z } from "zod";

export const postIdSchema = z.object({
  postId: z.uuid(),
});
export type PostIdInput = z.infer<typeof postIdSchema>;
