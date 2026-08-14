import { z } from "zod";

export const timelineKindSchema = z.enum([
  "role",
  "education",
  "talk",
  "award",
  "oss_contribution",
]);

const timelineFields = {
  kind: timelineKindSchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  org: z.string().max(200).optional().nullable(),
  org_url: z.string().max(2000).optional().nullable(),
  start_date: z.string().max(32).optional().nullable(),
  end_date: z.string().max(32).optional().nullable(),
  is_current: z.boolean(),
  description_md: z.string(),
  highlights: z.array(z.string().trim().min(1).max(300)).max(20),
  sort_order: z.number().int(),
};

export const createTimelineSchema = z.object(timelineFields);

export const updateTimelineSchema = z.object({
  id: z.uuid(),
  ...timelineFields,
});

export const timelineIdSchema = z.object({
  id: z.uuid(),
});

export type CreateTimelineInput = z.infer<typeof createTimelineSchema>;
export type UpdateTimelineInput = z.infer<typeof updateTimelineSchema>;
export type TimelineKind = z.infer<typeof timelineKindSchema>;
