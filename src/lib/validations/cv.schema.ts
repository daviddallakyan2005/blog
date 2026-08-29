import { z } from "zod";

export const updateCvSchema = z.object({
  cv_md: z.string(),
});

export type UpdateCvInput = z.infer<typeof updateCvSchema>;
