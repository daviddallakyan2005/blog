import { z } from "zod";

export const siteSocialSchema = z.object({
  github: z.string().max(2000).optional().nullable(),
  twitter: z.string().max(2000).optional().nullable(),
  linkedin: z.string().max(2000).optional().nullable(),
  email: z.string().max(320).optional().nullable(),
});

export const updateSettingsSchema = z.object({
  display_name: z.string().max(200).optional().nullable(),
  tagline: z.string().max(300).optional().nullable(),
  bio_md: z.string(),
  social: siteSocialSchema,
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SiteSocialInput = z.infer<typeof siteSocialSchema>;
